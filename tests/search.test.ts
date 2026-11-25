import { describe, expect, it } from 'vitest';
import { parseSearchFilters, searchParamsFromFilters } from '../src/search';

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

  it('parses combined advanced filters and allowlisted amenities', () => {
    const cityId = crypto.randomUUID();
    const neighbourhoodId = crypto.randomUUID();
    const filters = parseSearchFilters(new URLSearchParams({
      listing: 'rent', province: 'Lusaka', city: cityId, neighbourhood: neighbourhoodId,
      minPrice: '2500', maxPrice: '12000', bedrooms: '3', bathrooms: '2', minLandSize: '400',
      minFloorSize: '120', furnished: 'furnished', condition: 'new', verification: 'verified',
      amenities: 'borehole,solar,not-allowed', sort: 'priceAsc',
    }), 'sale');

    expect(filters).toMatchObject({
      listingType: 'rent', province: 'Lusaka', cityId, neighborhoodId: neighbourhoodId,
      minPrice: 2500, maxPrice: 12000, bedrooms: 3, bathrooms: 2, minLandSize: 400,
      minFloorSize: 120, furnishedStatus: 'furnished', condition: 'new',
      verificationStatus: 'verified', amenities: ['borehole', 'solar'], sort: 'priceAsc',
    });
  });

  it('round-trips shareable search state', () => {
    const filters = parseSearchFilters(new URLSearchParams({ listing: 'sale', province: 'Copperbelt', bedrooms: '4', amenities: 'solar,water-tank', sort: 'newest', page: '2' }), 'rent');
    expect(parseSearchFilters(searchParamsFromFilters(filters), 'rent')).toEqual(filters);
  });

  it('drops invalid ranges instead of sending them to the database', () => {
    const filters = parseSearchFilters(new URLSearchParams({ minPrice: '5000', maxPrice: '1000', bedrooms: '-2', bathrooms: '99', minLandSize: '-1' }), 'sale');
    expect(filters.minPrice).toBeUndefined();
    expect(filters.maxPrice).toBeUndefined();
    expect(filters.bedrooms).toBeUndefined();
    expect(filters.bathrooms).toBeUndefined();
    expect(filters.minLandSize).toBeUndefined();
  });
});
