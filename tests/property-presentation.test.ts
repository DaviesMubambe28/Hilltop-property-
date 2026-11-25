import { describe, expect, it } from 'vitest';
import { propertyFacts, propertyPrice } from '../src/property-presentation';
import { demoProperty } from '../src/demo-property';

describe('category-aware property presentation', () => {
  it('never presents bedrooms or washrooms as land specifications', () => {
    const facts = propertyFacts({ ...demoProperty, property_type: { slug: 'plot', name: 'Plot' }, land_size: 0, bedrooms: 0 });
    expect(facts).toContainEqual({ label: 'Land area', value: '0 m²' });
    expect(facts.some(fact => /bed|bath|washroom/i.test(fact.label))).toBe(false);
  });
  it('separates commercial floor area from residential room counts', () => {
    const facts = propertyFacts({ ...demoProperty, property_type: { slug: 'office', name: 'Office' } });
    expect(facts).toContainEqual({ label: 'Floor area', value: '310 m²' });
    expect(facts.some(fact => fact.label === 'Bedrooms')).toBe(false);
  });
  it('distinguishes missing data from a supplied zero', () => {
    expect(propertyFacts({ ...demoProperty, bedrooms: null })).toContainEqual({ label: 'Bedrooms', value: 'Not provided' });
    expect(propertyFacts({ ...demoProperty, bedrooms: 0 })).toContainEqual({ label: 'Bedrooms', value: '0' });
  });
  it('includes the period in rent and preserves price on enquiry', () => {
    expect(propertyPrice({ ...demoProperty, price_period: 'month' })).toContain('/ month');
    expect(propertyPrice({ ...demoProperty, price: null })).toBe('Price on enquiry');
  });
});
