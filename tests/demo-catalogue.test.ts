import { describe, expect, it } from 'vitest';
import { demoProperties, filterDemoProperties } from '../src/demo-catalogue';

describe('development catalogue', () => {
  it('contains eleven visibly labelled synthetic listings', () => {
    expect(demoProperties).toHaveLength(11);
    expect(demoProperties.every((property) => property.title.startsWith('[DEMO]'))).toBe(true);
  });

  it('filters by listing type, location text, price and bedrooms', () => {
    const result = filterDemoProperties(demoProperties, {
      query: 'Kabulonga', listingType: 'sale', minPrice: 1_000_000, maxPrice: 5_000_000, bedrooms: 4, page: 1, pageSize: 12,
    });
    expect(result.data.map((property) => property.reference)).toEqual(['DEMO-SALE-001']);
  });

  it('sorts priced listings and paginates without exposing unavailable inventory', () => {
    const result = filterDemoProperties(demoProperties, { listingType: 'sale', sort: 'priceAsc', page: 1, pageSize: 2 });
    expect(result.total).toBeGreaterThan(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].price ?? Infinity).toBeLessThanOrEqual(result.data[1].price ?? Infinity);
    expect(result.data.every((property) => property.is_available)).toBe(true);
  });
});
