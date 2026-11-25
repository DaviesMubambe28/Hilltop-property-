import { describe, expect, it } from 'vitest';
import { safeStorageName, validateVerificationFile, verificationFileLimit } from '../src/verification';

describe('verification documents', () => {
  it('accepts supported documents within the storage limit', () => {
    expect(validateVerificationFile({ name: 'title.pdf', type: 'application/pdf', size: verificationFileLimit })).toBeNull();
  });
  it('rejects unsupported, empty and oversized files', () => {
    expect(validateVerificationFile({ name: 'script.svg', type: 'image/svg+xml', size: 100 })).toMatch(/PDF/);
    expect(validateVerificationFile({ name: 'empty.pdf', type: 'application/pdf', size: 0 })).toMatch(/between/);
    expect(validateVerificationFile({ name: 'large.pdf', type: 'application/pdf', size: verificationFileLimit + 1 })).toMatch(/between/);
  });
  it('normalises unsafe storage names', () => expect(safeStorageName('../../title deed (final).pdf')).toBe('.._.._title_deed__final_.pdf'));
});
