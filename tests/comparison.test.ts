import { describe, expect, it } from 'vitest';
import { parseComparisonSlugs, toggleComparisonSlug } from '../src/comparison';

describe('property comparison selection', () => {
  it('keeps at most four unique valid slugs', () => expect(parseComparisonSlugs('one,two,two,three,four,five,<bad>')).toEqual(['one','two','three','four']));
  it('adds and removes a listing without exceeding four', () => {
    expect(toggleComparisonSlug(['one','two'],'three')).toEqual(['one','two','three']);
    expect(toggleComparisonSlug(['one','two'],'two')).toEqual(['one']);
    expect(() => toggleComparisonSlug(['one','two','three','four'],'five')).toThrow('four');
  });
});
