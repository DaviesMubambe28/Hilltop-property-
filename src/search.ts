import { z } from 'zod';
import type { ListingType, SearchFilters } from './types';

const uuid = z.string().uuid();
const query = z.string().trim().min(1).max(120);
const page = z.coerce.number().int().min(1);
const listing = z.enum(['sale', 'rent', 'investment']);
const province = z.string().trim().min(1).max(80).regex(/^[\p{L}\s'-]+$/u);
const count = z.coerce.number().int().min(0).max(20);
const amount = z.coerce.number().finite().min(0).max(1_000_000_000_000);
const size = z.coerce.number().finite().min(0).max(100_000_000);
const furnished = z.enum(['furnished', 'unfurnished', 'part-furnished']);
const condition = z.enum(['new', 'excellent', 'good', 'renovation']);
const verification = z.enum(['unverified', 'pending', 'verified']);
const sort = z.enum(['newest', 'priceAsc', 'priceDesc', 'sizeDesc']);
const allowedAmenities = new Set(['borehole', 'solar', 'water-tank', 'gated-community', 'road-frontage', 'electricity', 'title-deeds', 'serviced-plot']);
const priceRanges = new Map<string, Pick<SearchFilters, 'minPrice' | 'maxPrice'>>([
  ['0-1000000', { minPrice: 0, maxPrice: 1_000_000 }],
  ['1000000-5000000', { minPrice: 1_000_000, maxPrice: 5_000_000 }],
  ['5000000-', { minPrice: 5_000_000 }],
]);

export function parseSearchFilters(params: URLSearchParams, listingType: ListingType): SearchFilters {
  const optional = <T>(schema: z.ZodType<T>, key: string) => {
    const value = params.get(key);
    return value === null || value === '' ? { success: false as const } : schema.safeParse(value);
  };
  const queryResult = query.safeParse(params.get('q'));
  const locationResult = uuid.safeParse(params.get('location'));
  const typeResult = uuid.safeParse(params.get('type'));
  const pageResult = page.safeParse(params.get('page') ?? '1');
  const price = priceRanges.get(params.get('price') ?? '');
  const parsedListing = listing.safeParse(params.get('listing'));
  const parsedProvince = province.safeParse(params.get('province'));
  const city = uuid.safeParse(params.get('city'));
  const neighborhood = uuid.safeParse(params.get('neighbourhood'));
  const minPrice = optional(amount, 'minPrice');
  const maxPrice = optional(amount, 'maxPrice');
  const bedrooms = optional(count, 'bedrooms');
  const bathrooms = optional(count, 'bathrooms');
  const minLandSize = optional(size, 'minLandSize');
  const minFloorSize = optional(size, 'minFloorSize');
  const parsedFurnished = furnished.safeParse(params.get('furnished'));
  const parsedCondition = condition.safeParse(params.get('condition'));
  const parsedVerification = verification.safeParse(params.get('verification'));
  const parsedSort = sort.safeParse(params.get('sort'));
  const amenities = (params.get('amenities') ?? '').split(',').filter((value) => allowedAmenities.has(value));
  const explicitRange = minPrice.success || maxPrice.success;
  const validRange = !minPrice.success || !maxPrice.success || minPrice.data <= maxPrice.data;

  return {
    ...(queryResult.success ? { query: queryResult.data } : {}),
    ...(locationResult.success ? { locationId: locationResult.data } : {}),
    ...(typeResult.success ? { propertyTypeId: typeResult.data } : {}),
    ...(parsedProvince.success ? { province: parsedProvince.data } : {}),
    ...(city.success ? { cityId: city.data } : {}),
    ...(neighborhood.success ? { neighborhoodId: neighborhood.data } : {}),
    listingType: parsedListing.success ? parsedListing.data : listingType,
    ...(!explicitRange ? price : {}),
    ...(validRange && minPrice.success ? { minPrice: minPrice.data } : {}),
    ...(validRange && maxPrice.success ? { maxPrice: maxPrice.data } : {}),
    ...(bedrooms.success ? { bedrooms: bedrooms.data } : {}),
    ...(bathrooms.success ? { bathrooms: bathrooms.data } : {}),
    ...(minLandSize.success ? { minLandSize: minLandSize.data } : {}),
    ...(minFloorSize.success ? { minFloorSize: minFloorSize.data } : {}),
    ...(parsedFurnished.success ? { furnishedStatus: parsedFurnished.data } : {}),
    ...(parsedCondition.success ? { condition: parsedCondition.data } : {}),
    ...(parsedVerification.success ? { verificationStatus: parsedVerification.data } : {}),
    ...(amenities.length ? { amenities: [...new Set(amenities)] } : {}),
    ...(parsedSort.success ? { sort: parsedSort.data } : {}),
    page: pageResult.success ? Math.min(pageResult.data, 1_000) : 1,
    pageSize: 8,
  };
}

export function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const values: Array<[string, string | number | undefined]> = [
    ['q', filters.query], ['location', filters.locationId], ['province', filters.province],
    ['city', filters.cityId], ['neighbourhood', filters.neighborhoodId], ['type', filters.propertyTypeId],
    ['listing', filters.listingType], ['minPrice', filters.minPrice], ['maxPrice', filters.maxPrice],
    ['bedrooms', filters.bedrooms], ['bathrooms', filters.bathrooms], ['minLandSize', filters.minLandSize],
    ['minFloorSize', filters.minFloorSize], ['furnished', filters.furnishedStatus], ['condition', filters.condition],
    ['verification', filters.verificationStatus], ['sort', filters.sort],
  ];
  values.forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}
