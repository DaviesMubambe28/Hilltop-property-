import { describe, expect, it } from 'vitest';
import { parseSearchFilters } from '../src/search';

describe('search parameter validation', () => {
  it('accepts supported filters and normalises the query', () => {
    const locationId = crypto.randomUUID();
    const typeId = crypto.randomUUID();
    const filters = parseSearchFilters(new URLSearchParams({
      q: '  family home  ',
      location: locationId,
      type: typeId,
      price: '1000000-5000000',
      page: '3',
    }), 'sale');

    expect(filters).toEqual({
      query: 'family home',
      locationId,
      propertyTypeId: typeId,
      listingType: 'sale',
      minPrice: 1_000_000,
      maxPrice: 5_000_000,
      page: 3,
      pageSize: 8,
    });
  });

  it('ignores malformed identifiers, price ranges, and pages', () => {
    const filters = parseSearchFilters(new URLSearchParams({
      location: 'not-a-uuid',
      type: "' or true --",
      price: '-1-NaN',
      page: 'not-a-number',
    }), 'sale');

    expect(filters).toEqual({ listingType: 'sale', page: 1, pageSize: 8 });
  });

  it('caps excessive pages and rejects overlong queries', () => {
    expect(parseSearchFilters(new URLSearchParams({ page: '999999' }), 'rent').page).toBe(1_000);
    expect(parseSearchFilters(new URLSearchParams({ q: 'x'.repeat(121) }), 'rent').query).toBeUndefined();
  });
});
