import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4.1.12';
import { consumeRateLimit, hmac, originAllowed, requestIp } from '../_shared/security.ts';

const inputSchema = z.object({
  type: z.enum(['property', 'general', 'viewing', 'valuation']),
  propertyId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10).max(4000),
  preferredDate: z.string().datetime().optional(),
  consent: z.literal(true),
  idempotencyKey: z.string().uuid(),
  website: z.string().max(0).optional(),
}).superRefine((input, context) => {
  if (['property', 'viewing'].includes(input.type) && !input.propertyId) {
    context.addIssue({ code: 'custom', path: ['propertyId'], message: 'A property is required.' });
  }
  if (!['property', 'viewing'].includes(input.type) && input.propertyId) {
    context.addIssue({ code: 'custom', path: ['propertyId'], message: 'This enquiry type cannot reference a property.' });
  }
});

const allowedOrigin = Deno.env.get('SITE_URL') ?? 'http://localhost:4173';
const headers = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST is required.' } }, 405);
  if (!originAllowed(request, allowedOrigin)) return response({ error: { code: 'FORBIDDEN_ORIGIN', message: 'This origin is not allowed.' } }, 403);
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) return response({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request is too large.' } }, 413);

  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return response({ error: { code: 'VALIDATION_ERROR', message: 'Please check the enquiry details.', details: parsed.error.flatten().fieldErrors } }, 422);
    const input = parsed.data;
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const existing = await client.from('enquiries').select('id').eq('idempotency_key', input.idempotencyKey).maybeSingle();
    if (existing.data) return response({ id: existing.data.id, duplicate: true });

    const rateLimitSecret = Deno.env.get('RATE_LIMIT_SECRET');
    if (!rateLimitSecret || rateLimitSecret.length < 32) throw new Error('rate_limit_secret_not_configured');
    const ip = requestIp(request);
    const ipHash = await hmac(`enquiry-ip:${ip}`, rateLimitSecret);
    const addressHash = await hmac(`enquiry-address:${ip}:${input.email.toLowerCase()}`, rateLimitSecret);
    const [ipAllowed, addressAllowed] = await Promise.all([
      consumeRateLimit(client, 'enquiry-ip', ipHash, 20, 3600),
      consumeRateLimit(client, 'enquiry-address', addressHash, 5, 600),
    ]);
    if (!ipAllowed || !addressAllowed) return response({ error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again later.' } }, 429);

    if (input.propertyId && ['property', 'viewing'].includes(input.type)) {
      const property = await client.from('properties').select('id').eq('id', input.propertyId).eq('status', 'published').eq('is_available', true).maybeSingle();
      if (property.error) throw property.error;
      if (!property.data) return response({ error: { code: 'INVALID_PROPERTY', message: 'This property is not available for enquiries.' } }, 422);
    }
    const authHeader = request.headers.get('authorization');
    let customerId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      customerId = (await client.auth.getUser(token)).data.user?.id ?? null;
    }
    const inserted = await client.from('enquiries').insert({ type: input.type, property_id: input.propertyId ?? null, customer_id: customerId, name: input.name, email: input.email.toLowerCase(), phone: input.phone || null, message: input.message, preferred_date: input.preferredDate ?? null, consent: true, idempotency_key: input.idempotencyKey }).select('id').single();
    if (inserted.error) {
      if (inserted.error.code === '23505') {
        const duplicate = await client.from('enquiries').select('id').eq('idempotency_key', input.idempotencyKey).single();
        return response({ id: duplicate.data?.id, duplicate: true });
      }
      throw inserted.error;
    }
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const staffEmail = Deno.env.get('STAFF_NOTIFICATION_EMAIL');
    if (resendKey && staffEmail) {
      const emailResponse = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM'), to: [staffEmail], subject: `New ${input.type} enquiry`, text: `Reference: ${inserted.data.id}\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || 'Not supplied'}\n\n${input.message}` }) });
      if (!emailResponse.ok) console.error('enquiry_email_failed', { enquiryId: inserted.data.id, status: emailResponse.status });
    }
    return response({ id: inserted.data.id }, 201);
  } catch (error) {
    console.error('submit_enquiry_failed', { message: error instanceof Error ? error.message : 'unknown' });
    return response({ error: { code: 'INTERNAL_ERROR', message: 'The enquiry could not be submitted.' } }, 500);
  }
});
