import { describe, expect, it } from 'vitest';
import { hmac, originAllowed, requestIp } from '../supabase/functions/_shared/security';

describe('Edge Function security helpers', () => {
  it('uses the proxy-adjacent forwarded address instead of a spoofed first value', () => {
    const request = new Request('https://example.com', { headers: { 'x-forwarded-for': 'spoofed, 192.0.2.10' } });
    expect(requestIp(request)).toBe('192.0.2.10');
  });

  it('rejects an unexpected browser origin but permits server clients without Origin', () => {
    expect(originAllowed(new Request('https://example.com', { headers: { origin: 'https://evil.example' } }), 'https://hilltop.example')).toBe(false);
    expect(originAllowed(new Request('https://example.com'), 'https://hilltop.example')).toBe(true);
  });

  it('creates stable, secret-dependent pseudonymous hashes', async () => {
    const first = await hmac('192.0.2.10', 'a'.repeat(32));
    expect(first).toHaveLength(64);
    expect(await hmac('192.0.2.10', 'a'.repeat(32))).toBe(first);
    expect(await hmac('192.0.2.10', 'b'.repeat(32))).not.toBe(first);
  });
});
