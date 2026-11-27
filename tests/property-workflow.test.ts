import { describe, expect, it } from 'vitest';
import {
  canTransitionListing,
  normalizeImageOrder,
  validatePropertyDraft,
} from '../src/property-workflow';

describe('property workflow', () => {
  it('keeps approval and publishing under administrator control', () => {
    expect(canTransitionListing('agent', 'draft', 'submitted')).toBe(true);
    expect(canTransitionListing('agent', 'submitted', 'approved')).toBe(false);
    expect(canTransitionListing('editor', 'under_review', 'approved')).toBe(false);
    expect(canTransitionListing('admin', 'under_review', 'approved')).toBe(true);
    expect(canTransitionListing('admin', 'approved', 'published')).toBe(true);
  });

  it('allows agents to resubmit requested changes', () => {
    expect(canTransitionListing('agent', 'changes_requested', 'submitted')).toBe(true);
    expect(canTransitionListing('agent', 'rejected', 'submitted')).toBe(false);
  });

  it('validates required property fields and financial boundaries', () => {
    expect(() => validatePropertyDraft({
      reference: 'HT-100', title: 'Family home in Kabulonga', slug: 'family-home-kabulonga',
      listingType: 'sale', propertyTypeId: 'type-id', locationId: 'location-id',
      price: 2_500_000, currency: 'ZMW', description: 'A considered home with generous living spaces.',
    })).not.toThrow();
    expect(() => validatePropertyDraft({
      reference: '', title: 'Home', slug: 'Not valid', listingType: 'sale',
      propertyTypeId: '', locationId: '', price: -1, currency: 'ZMW', description: 'Short',
    })).toThrow('Complete the required property details');
  });

  it('normalizes image positions and preserves one primary image', () => {
    expect(normalizeImageOrder([
      { id: 'b', isPrimary: false },
      { id: 'a', isPrimary: true },
      { id: 'c', isPrimary: true },
    ])).toEqual([
      { id: 'b', position: 0, isPrimary: false },
      { id: 'a', position: 1, isPrimary: true },
      { id: 'c', position: 2, isPrimary: false },
    ]);
  });
});
