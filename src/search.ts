import { z } from 'zod';
import type { ListingType, SearchFilters } from './types';

const uuid = z.string().uuid();
const query = z.string().trim().min(1).max(120);
const page = z.coerce.number().int().min(1);
const priceRanges = new Map<string, Pick<SearchFilters, 'minPrice' | 'maxPrice'>>([
  ['0-1000000', { minPrice: 0, maxPrice: 1_000_000 }],
  ['1000000-5000000', { minPrice: 1_000_000, maxPrice: 5_000_000 }],
  ['5000000-', { minPrice: 5_000_000 }],
]);

export function parseSearchFilters(params: URLSearchParams, listingType: ListingType): SearchFilters {
  const queryResult = query.safeParse(params.get('q'));
  const locationResult = uuid.safeParse(params.get('location'));
  const typeResult = uuid.safeParse(params.get('type'));
  const pageResult = page.safeParse(params.get('page') ?? '1');
  const price = priceRanges.get(params.get('price') ?? '');

  return {
    ...(queryResult.success ? { query: queryResult.data } : {}),
    ...(locationResult.success ? { locationId: locationResult.data } : {}),
    ...(typeResult.success ? { propertyTypeId: typeResult.data } : {}),
    listingType,
    ...price,
    page: pageResult.success ? Math.min(pageResult.data, 1_000) : 1,
    pageSize: 8,
  };
}
