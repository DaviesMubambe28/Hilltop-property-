type SupabaseRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const encoder = new TextEncoder();

export function requestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((value) => value.trim()).filter(Boolean);
  return request.headers.get('cf-connecting-ip')
    ?? forwarded?.at(-1)
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function consumeRateLimit(
  client: SupabaseRpcClient,
  bucket: string,
  keyHash: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const result = await client.rpc('consume_rate_limit', {
    p_bucket: bucket,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (result.error) throw new Error(`rate_limit_unavailable: ${result.error.message}`);
  return result.data === true;
}

export function originAllowed(request: Request, allowedOrigin: string): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === allowedOrigin;
}
