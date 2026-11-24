import { requireSupabase } from '../supabase';
import type { Property, SearchFilters } from '../types';

const select = `id,reference,slug,title,summary,description,listing_type,price,price_period,currency,bedrooms,bathrooms,land_size,land_unit,address,is_featured,
  location:locations(name,slug),property_type:property_types(name,slug),agent:agents(name,phone,email),images:property_images(storage_path,alt_text,is_primary,position)`;

export async function listProperties(filters: SearchFilters): Promise<{ data: Property[]; total: number }> {
  const client = requireSupabase();
  const from = (filters.page - 1) * filters.pageSize;
  let query = client.from('properties').select(select, { count: 'exact' }).eq('status', 'published').eq('is_available', true);
  if (filters.query) query = query.textSearch('search_document', filters.query, { type: 'websearch' });
  if (filters.locationId) query = query.eq('location_id', filters.locationId);
  if (filters.propertyTypeId) query = query.eq('property_type_id', filters.propertyTypeId);
  if (filters.listingType) query = query.eq('listing_type', filters.listingType);
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
  if (filters.bedrooms !== undefined) query = query.gte('bedrooms', filters.bedrooms);
  query = filters.sort === 'priceAsc' ? query.order('price') : filters.sort === 'priceDesc' ? query.order('price', { ascending: false }) : query.order('published_at', { ascending: false });
  const { data, count, error } = await query.range(from, from + filters.pageSize - 1);
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as unknown as Property[], total: count ?? 0 };
}

export async function listOptions() {
  const client = requireSupabase();
  const [locations, types] = await Promise.all([
    client.from('locations').select('id,name').eq('is_published', true).order('name'),
    client.from('property_types').select('id,name').order('name'),
  ]);
  if (locations.error) throw new Error(locations.error.message);
  if (types.error) throw new Error(types.error.message);
  return { locations: locations.data, types: types.data };
}

export function imageUrl(path: string): string {
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
