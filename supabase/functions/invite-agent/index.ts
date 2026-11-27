import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import { z } from 'npm:zod@4.1.12';
import { originAllowed } from '../_shared/security.ts';

const schema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  branchId: z.string().uuid().nullable(),
});

const allowedOrigin = Deno.env.get('SITE_URL') ?? 'http://localhost:4173';
const headers = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: { message: 'POST is required.' } }, 405);
  if (!originAllowed(request, allowedOrigin)) return response({ error: { message: 'This origin is not allowed.' } }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 10_000) return response({ error: { message: 'The request is too large.' } }, 413);

  let invitedUserId: string | null = null;
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return response({ error: { message: 'Administrator authentication is required.' } }, 401);
    const input = schema.safeParse(await request.json());
    if (!input.success) return response({ error: { message: 'Check the agent details.' } }, 422);

    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    const token = authorization.replace(/^Bearer\s+/i, '');
    const caller = await client.auth.getUser(token);
    if (caller.error || !caller.data.user) return response({ error: { message: 'Administrator authentication is required.' } }, 401);
    const profile = await client.from('profiles').select('role,is_active').eq('id', caller.data.user.id).single();
    if (profile.error || profile.data?.role !== 'admin' || !profile.data.is_active) {
      return response({ error: { message: 'Administrator access is required.' } }, 403);
    }

    const redirectTo = new URL('/reset-password.html', allowedOrigin).toString();
    const invited = await client.auth.admin.inviteUserByEmail(input.data.email.toLowerCase(), {
      redirectTo,
      data: { full_name: input.data.fullName },
    });
    if (invited.error || !invited.data.user) {
      const duplicate = invited.error?.message.toLowerCase().includes('already') ?? false;
      return response({ error: { message: duplicate ? 'An account already exists for this email.' : 'The invitation could not be created.' } }, duplicate ? 409 : 400);
    }

    const userId = invited.data.user.id;
    invitedUserId = userId;
    const profileUpdate = await client.from('profiles').update({
      full_name: input.data.fullName,
      phone: input.data.phone || null,
      role: 'agent',
      branch_id: input.data.branchId,
      is_active: true,
    }).eq('id', userId);
    if (profileUpdate.error) throw profileUpdate.error;
    const agent = await client.from('agents').insert({
      profile_id: userId,
      branch_id: input.data.branchId,
      name: input.data.fullName,
      slug: `${input.data.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${userId.slice(0, 8)}`,
      title: input.data.title || 'Property agent',
      email: input.data.email.toLowerCase(),
      phone: input.data.phone || null,
      is_published: false,
    }).select('id').single();
    if (agent.error) throw agent.error;
    invitedUserId = null;
    return response({ userId, agentId: agent.data.id }, 201);
  } catch (error) {
    if (invitedUserId) {
      const cleanup = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } },
      );
      await cleanup.auth.admin.deleteUser(invitedUserId);
    }
    console.error('invite_agent_failed', { message: error instanceof Error ? error.message : 'unknown' });
    return response({ error: { message: 'The agent invitation could not be completed.' } }, 500);
  }
});
