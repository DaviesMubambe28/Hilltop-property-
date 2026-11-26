export function safeReturnPath(value: string | null, fallback = '/account.html'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const origin = globalThis.location?.origin ?? 'https://local.invalid';
    const url = new URL(value, origin);
    if (url.origin !== origin || !url.pathname.startsWith('/')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
