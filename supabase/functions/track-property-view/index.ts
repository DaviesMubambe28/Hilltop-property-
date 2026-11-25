import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4.1.12';
import { consumeRateLimit, hmac, originAllowed, requestIp } from '../_shared/security.ts';

const inputSchema = z.object({ propertyId: z.string().uuid() });
const allowedOrigin = Deno.env.get('SITE_URL') ?? 'http://localhost:4173';
const headers = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST is required.' } }, 405);
  if (!originAllowed(request, allowedOrigin)) return response({ error: { code: 'FORBIDDEN_ORIGIN', message: 'This origin is not allowed.' } }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 1_000) return response({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request is too large.' } }, 413);

  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return response({ error: { code: 'VALIDATION_ERROR', message: 'Invalid property view.' } }, 422);
    const secret = Deno.env.get('RATE_LIMIT_SECRET');
    if (!secret || secret.length < 32) throw new Error('rate_limit_secret_not_configured');

    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const property = await client.from('properties').select('id').eq('id', parsed.data.propertyId).eq('status', 'published').eq('is_available', true).maybeSingle();
    if (property.error) throw property.error;
    if (!property.data) return response({ error: { code: 'NOT_FOUND', message: 'Property not found.' } }, 404);

    const ip = requestIp(request);
    const ipHash = await hmac(`property-view-ip:${ip}`, secret);
    if (!await consumeRateLimit(client, 'property-view-ip', ipHash, 120, 3600)) {
      return response({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, 429);
    }

    const sessionHash = await hmac(`property-view-session:${ip}:${request.headers.get('user-agent') ?? 'unknown'}`, secret);
    const since = new Date(Date.now() - 30 * 60_000).toISOString();
    const duplicate = await client.from('property_views').select('id').eq('property_id', parsed.data.propertyId).eq('session_hash', sessionHash).gte('viewed_at', since).limit(1).maybeSingle();
    if (duplicate.error) throw duplicate.error;
    if (duplicate.data) return response({ recorded: false, duplicate: true });

    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) userId = (await client.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''))).data.user?.id ?? null;
    const inserted = await client.from('property_views').insert({ property_id: parsed.data.propertyId, user_id: userId, session_hash: sessionHash });
    if (inserted.error) throw inserted.error;
    return response({ recorded: true }, 201);
  } catch (error) {
    console.error('track_property_view_failed', { message: error instanceof Error ? error.message : 'unknown' });
    return response({ error: { code: 'INTERNAL_ERROR', message: 'The view could not be recorded.' } }, 500);
  }
});
