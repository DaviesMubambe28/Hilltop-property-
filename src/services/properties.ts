import { requireSupabase } from '../supabase';
import type { Property, SearchFilters } from '../types';
import { persistedSearchFilters, savedSearchName } from '../saved-searches';

const select = `id,reference,slug,title,summary,description,listing_type,price,price_period,currency,bedrooms,bathrooms,land_size,land_unit,floor_size,furnished_status,condition,verification_status,is_available,latitude,longitude,address,is_featured,
  location:locations(name,slug),property_type:property_types(name,slug),agent:agents(name,phone,email),images:property_images(storage_path,alt_text,is_primary,position),amenities:property_amenities(amenity:amenities(name,slug))`;

export async function listProperties(filters: SearchFilters): Promise<{ data: Property[]; total: number }> {
  const client = requireSupabase();
  const offset = (filters.page - 1) * filters.pageSize;
  const matched = await client.rpc('search_property_ids', {
    p_query: filters.query ?? null, p_location_id: filters.locationId ?? null, p_province: filters.province ?? null,
    p_city_id: filters.cityId ?? null, p_neighborhood_id: filters.neighborhoodId ?? null,
    p_property_type_id: filters.propertyTypeId ?? null, p_listing_type: filters.listingType ?? null,
    p_min_price: filters.minPrice ?? null, p_max_price: filters.maxPrice ?? null,
    p_bedrooms: filters.bedrooms ?? null, p_bathrooms: filters.bathrooms ?? null,
    p_min_land_size: filters.minLandSize ?? null, p_min_floor_size: filters.minFloorSize ?? null,
    p_furnished_status: filters.furnishedStatus ?? null, p_condition: filters.condition ?? null,
    p_verification_status: filters.verificationStatus ?? null, p_amenities: filters.amenities ?? [],
    p_sort: filters.sort ?? 'newest', p_limit: filters.pageSize, p_offset: offset,
  });
  if (matched.error) throw new Error(matched.error.message);
  const rows = (matched.data ?? []) as Array<{ property_id: string; total_count: number }>;
  if (!rows.length) return { data: [], total: 0 };
  const ids = rows.map((row) => row.property_id);
  const result = await client.from('properties').select(select).in('id', ids);
  if (result.error) throw new Error(result.error.message);
  const propertyRows = (result.data ?? []) as unknown as Property[];
  const byId = new Map(propertyRows.map((property) => [property.id, property]));
  return { data: ids.map((id) => byId.get(id)).filter((property): property is Property => Boolean(property)), total: Number(rows[0].total_count) };
}

export async function listOptions() {
  const client = requireSupabase();
  const [locations, types] = await Promise.all([
    client.from('locations').select('id,name,province,parent_id').eq('is_published', true).order('name'),
    client.from('property_types').select('id,name,slug').order('name'),
  ]);
  if (locations.error) throw new Error(locations.error.message);
  if (types.error) throw new Error(types.error.message);
  return { locations: locations.data, types: types.data };
}

export function imageUrl(path: string): string {
  if (path.startsWith('/')) return path;
  return requireSupabase().storage.from('property-media').getPublicUrl(path).data.publicUrl;
}

export async function toggleSaved(propertyId: string): Promise<boolean> {
  const client = requireSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Sign in to save properties.');
  const existing = await client.from('saved_properties').select('property_id').eq('user_id', user.id).eq('property_id', propertyId).maybeSingle();
  if (existing.data) {
    const { error } = await client.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId);
    if (error) throw new Error(error.message);
    return false;
  }
  const { error } = await client.from('saved_properties').insert({ user_id: user.id, property_id: propertyId });
  if (error) throw new Error(error.message);
  return true;
}

export async function recordPropertyView(propertyId: string): Promise<void> {
  const { error } = await requireSupabase().functions.invoke('track-property-view', { body: { propertyId } });
  if (error) throw new Error(error.message);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const result = await requireSupabase().from('properties').select(select).eq('slug', slug).eq('status', 'published').eq('is_available', true).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as unknown as Property | null;
}

export async function listSimilarProperties(property: Property): Promise<Property[]> {
  const relatedSelect = property.property_type?.slug ? select.replace('property_type:property_types(name,slug)', 'property_type:property_types!inner(name,slug)') : select;
  let query = requireSupabase().from('properties').select(relatedSelect).eq('status', 'published').eq('is_available', true).neq('id', property.id).eq('listing_type', property.listing_type);
  if (property.property_type?.slug) query = query.eq('property_type.slug', property.property_type.slug);
  const result = await query.limit(3);
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as unknown as Property[];
}

export async function getPropertiesBySlugs(slugs: string[]): Promise<Property[]> {
  if (!slugs.length) return [];
  const result = await requireSupabase().from('properties').select(select).in('slug', slugs).eq('status', 'published').eq('is_available', true);
  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as unknown as Property[];
  const bySlug = new Map(rows.map((property) => [property.slug, property]));
  return slugs.map((slug) => bySlug.get(slug)).filter((property): property is Property => Boolean(property));
}

export async function savePropertySearch(name:string,filters:SearchFilters):Promise<void>{
  const client=requireSupabase();const{data:{user}}=await client.auth.getUser();if(!user)throw new Error('Sign in to save this search.');
  const{error}=await client.from('saved_searches').insert({user_id:user.id,name:savedSearchName(name),filters:persistedSearchFilters(filters),alert_enabled:true,last_checked_at:new Date().toISOString()});if(error)throw new Error(error.message);
}
