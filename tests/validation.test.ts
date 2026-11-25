import { describe, expect, it } from 'vitest';
import { enquirySchema, safeText, viewingRequestSchema } from '../src/validation';

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

describe('viewing request validation', () => {
  const request = { propertyId: crypto.randomUUID(), name: 'Jane Banda', email: 'jane@example.com', phone: '+260971000000', preferredStart: '2030-01-02T10:00:00.000Z', mode: 'physical', consent: true, idempotencyKey: crypto.randomUUID(), website: '' };
  it('accepts a future physical or virtual viewing request', () => expect(viewingRequestSchema.safeParse(request).success).toBe(true));
  it('rejects invalid contact details and honeypot content', () => expect(viewingRequestSchema.safeParse({ ...request, email: 'bad', website: 'bot' }).success).toBe(false));
  it('rejects unsupported viewing modes', () => expect(viewingRequestSchema.safeParse({ ...request, mode: 'telephone' }).success).toBe(false));
});
