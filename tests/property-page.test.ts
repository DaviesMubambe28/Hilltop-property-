import { describe, expect, it } from 'vitest';
import { propertySlugFromLocation, propertyStructuredData } from '../src/property-page';

describe('property page routing', () => {
  it('extracts a stable slug from a friendly URL', () => expect(propertySlugFromLocation('/property/foxdale-family-home', '')).toBe('foxdale-family-home'));
  it('supports the static-host query fallback', () => expect(propertySlugFromLocation('/property.html', '?slug=ibex-hill-villa')).toBe('ibex-hill-villa'));
  it('rejects malformed slugs', () => expect(propertySlugFromLocation('/property/<script>', '')).toBeNull());
});

describe('property structured data', () => {
  it('uses only supplied listing facts', () => {
    const data = propertyStructuredData({ title: 'Family Home', description: 'A real listing', reference: 'HT-1', price: 2_000_000, currency: 'ZMW', bedrooms: 3, bathrooms: 2, address: null, latitude: null, longitude: null, images: [], location: { name: 'Lusaka', slug: 'lusaka' } } as never, 'https://example.com/property/family-home', []);
    expect(data).toMatchObject({ '@type': 'RealEstateListing', name: 'Family Home', identifier: 'HT-1' });
    expect(data).not.toHaveProperty('geo');
  });
});
