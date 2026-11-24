import { z } from 'zod';

export const enquirySchema = z.object({
  type: z.enum(['property', 'general', 'viewing', 'valuation']),
  propertyId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10).max(4000),
  preferredDate: z.string().datetime().optional(),
  consent: z.literal(true),
  idempotencyKey: z.string().uuid(),
});

export function safeText(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
