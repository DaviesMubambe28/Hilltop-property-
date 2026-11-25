import { demoProperty } from './demo-property';
import type { Property, SearchFilters } from './types';

type DemoOverrides = Partial<Property> & Pick<Property, 'reference' | 'slug' | 'title' | 'listing_type'>;

function listing(overrides: DemoOverrides): Property {
  return {
    ...demoProperty,
    id: `30000000-0000-4000-8000-${String(demoPropertiesSeed.length + 1).padStart(12, '0')}`,
    is_featured: false,
    ...overrides,
  };
}

const demoPropertiesSeed: Property[] = [];
function add(overrides: DemoOverrides) { const property = listing(overrides); demoPropertiesSeed.push(property); return property; }

add({ ...demoProperty });
add({ reference: 'DEMO-RENT-001', slug: 'demo-ibex-hill-rental', title: '[DEMO] Ibex Hill rental home', listing_type: 'rent', price: 28_000, price_period: 'month', bedrooms: 3, bathrooms: 2, floor_size: 220, location: { name: 'Ibex Hill, Lusaka', slug: 'ibex-hill' }, property_type: { name: 'House', slug: 'house' }, is_featured: true });
add({ reference: 'DEMO-APT-001', slug: 'demo-foxdale-apartment', title: '[DEMO] Foxdale apartment', listing_type: 'sale', price: 1_750_000, bedrooms: 2, bathrooms: 2, floor_size: 115, location: { name: 'Foxdale, Lusaka', slug: 'foxdale' }, property_type: { name: 'Apartment', slug: 'apartment' } });
add({ reference: 'DEMO-PLOT-001', slug: 'demo-chongwe-residential-plot', title: '[DEMO] Chongwe residential plot', listing_type: 'sale', price: 620_000, bedrooms: 0, bathrooms: 0, floor_size: null, land_size: 1800, location: { name: 'Chongwe, Lusaka', slug: 'chongwe' }, property_type: { name: 'Plot', slug: 'plot' }, latitude: -15.329, longitude: 28.682 });
add({ reference: 'DEMO-OFFICE-001', slug: 'demo-makeni-office', title: '[DEMO] Makeni commercial office', listing_type: 'rent', price: 45_000, price_period: 'month', bedrooms: null, bathrooms: 2, floor_size: 420, location: { name: 'Makeni, Lusaka', slug: 'makeni' }, property_type: { name: 'Office', slug: 'office' }, latitude: -15.506, longitude: 28.239 });
add({ reference: 'DEMO-FARM-001', slug: 'demo-chongwe-farm', title: '[DEMO] Chongwe agricultural holding', listing_type: 'investment', price: 9_200_000, bedrooms: 3, bathrooms: 2, floor_size: 280, land_size: 42, land_unit: 'hectares', location: { name: 'Chongwe, Lusaka', slug: 'chongwe' }, property_type: { name: 'Farm', slug: 'farm' }, latitude: -15.281, longitude: 28.751, is_featured: true });
add({ reference: 'DEMO-ESTATE-001', slug: 'demo-livingstone-estate', title: '[DEMO] Livingstone private estate', listing_type: 'investment', price: null, bedrooms: 8, bathrooms: 7, floor_size: 1250, land_size: 148, land_unit: 'acres', location: { name: 'Livingstone, Southern', slug: 'livingstone' }, property_type: { name: 'Estate', slug: 'estate' }, latitude: -17.841, longitude: 25.854, is_featured: true });
add({ reference: 'DEMO-SOLD-001', slug: 'demo-sold-lusaka-home', title: '[DEMO] Sold Lusaka home', listing_type: 'sale', price: 3_100_000, bedrooms: 3, bathrooms: 2, location: { name: 'Lusaka', slug: 'lusaka' }, property_type: { name: 'House', slug: 'house' }, is_available: false });
add({ reference: 'DEMO-RENTED-001', slug: 'demo-rented-highlands-home', title: '[DEMO] Rented Highlands home', listing_type: 'rent', price: 18_000, price_period: 'month', bedrooms: 3, bathrooms: 2, location: { name: 'Highlands, Southern', slug: 'highlands' }, property_type: { name: 'House', slug: 'house' }, is_available: false });
add({ reference: 'DEMO-DRAFT-001', slug: 'demo-unpublished-retail', title: '[DEMO] Unpublished retail unit', listing_type: 'rent', price: 32_000, price_period: 'month', bedrooms: null, bathrooms: 1, location: { name: 'Lusaka', slug: 'lusaka' }, property_type: { name: 'Retail', slug: 'retail' }, is_available: false });
add({ reference: 'DEMO-RESERVED-001', slug: 'demo-reserved-siavonga-house', title: '[DEMO] Reserved Siavonga house', listing_type: 'sale', price: 5_400_000, bedrooms: 4, bathrooms: 3, location: { name: 'Siavonga, Southern', slug: 'siavonga' }, property_type: { name: 'House', slug: 'house' }, is_available: false });

export const demoProperties = demoPropertiesSeed;
export const demoTypeIds:Record<string,string>={house:'40000000-0000-4000-8000-000000000001',apartment:'40000000-0000-4000-8000-000000000002',plot:'40000000-0000-4000-8000-000000000003',office:'40000000-0000-4000-8000-000000000004',farm:'40000000-0000-4000-8000-000000000005',estate:'40000000-0000-4000-8000-000000000006',retail:'40000000-0000-4000-8000-000000000007'};

export function filterDemoProperties(properties: Property[], filters: SearchFilters): { data: Property[]; total: number } {
  const query = filters.query?.trim().toLowerCase();
  const filtered = properties.filter((property) => property.is_available)
    .filter((property) => !filters.listingType || property.listing_type === filters.listingType)
    .filter((property) => !query || [property.reference, property.title, property.summary, property.description, property.location?.name].some((value) => value?.toLowerCase().includes(query)))
    .filter((property) => !filters.province || property.location?.name.toLowerCase().includes(filters.province.toLowerCase()))
    .filter((property) => !filters.cityId || property.location?.slug === filters.cityId)
    .filter((property) => !filters.neighborhoodId || property.location?.slug === filters.neighborhoodId)
    .filter((property) => !filters.propertyTypeId || demoTypeIds[property.property_type?.slug??''] === filters.propertyTypeId)
    .filter((property) => filters.minPrice === undefined || property.price !== null && property.price >= filters.minPrice)
    .filter((property) => filters.maxPrice === undefined || property.price !== null && property.price <= filters.maxPrice)
    .filter((property) => filters.bedrooms === undefined || (property.bedrooms ?? 0) >= filters.bedrooms)
    .filter((property) => filters.bathrooms === undefined || (property.bathrooms ?? 0) >= filters.bathrooms)
    .filter((property) => filters.minLandSize === undefined || (property.land_size ?? 0) >= filters.minLandSize)
    .filter((property) => filters.minFloorSize === undefined || (property.floor_size ?? 0) >= filters.minFloorSize);
  const sorted = [...filtered].sort((a, b) => filters.sort === 'priceAsc' ? (a.price ?? Infinity) - (b.price ?? Infinity) : filters.sort === 'priceDesc' ? (b.price ?? -1) - (a.price ?? -1) : filters.sort === 'sizeDesc' ? (b.floor_size ?? b.land_size ?? 0) - (a.floor_size ?? a.land_size ?? 0) : Number(b.is_featured) - Number(a.is_featured));
  const offset = (filters.page - 1) * filters.pageSize;
  return { data: sorted.slice(offset, offset + filters.pageSize), total: sorted.length };
}
