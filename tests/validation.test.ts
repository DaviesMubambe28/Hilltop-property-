import { describe, expect, it } from 'vitest';
import { enquirySchema, safeText } from '../src/validation';

const valid = { type: 'property', propertyId: crypto.randomUUID(), name: 'Jane Banda', email: 'jane@example.com', phone: '+260971000000', message: 'Please arrange a viewing for this property.', consent: true, idempotencyKey: crypto.randomUUID() };

describe('enquiry validation', () => {
  it('accepts a complete enquiry', () => expect(enquirySchema.safeParse(valid).success).toBe(true));
  it('requires consent and a valid email', () => expect(enquirySchema.safeParse({ ...valid, consent: false, email: 'invalid' }).success).toBe(false));
  it('rejects short and oversized messages', () => {
    expect(enquirySchema.safeParse({ ...valid, message: 'short' }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...valid, message: 'x'.repeat(4001) }).success).toBe(false);
  });
  it('rejects a completed spam honeypot', () => expect(enquirySchema.safeParse({ ...valid, website: 'spam.example' }).success).toBe(false));
  it('requires a property only for property and viewing enquiries', () => {
    expect(enquirySchema.safeParse({ ...valid, propertyId: undefined }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...valid, type: 'general' }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...valid, type: 'general', propertyId: undefined }).success).toBe(true);
  });
  it('escapes untrusted content', () => expect(safeText('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
});
