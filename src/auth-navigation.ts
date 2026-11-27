const AUTH_ROUTES = new Set([
  '/sign-in.html',
  '/sign-up.html',
  '/forgot-password.html',
  '/reset-password.html',
  '/sign-out.html',
]);

export function safeReturnPath(value: string | null | undefined, fallback = '/account.html'): string {
  if (!value || value !== value.trim()) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127 || character === '\\';
  })) return fallback;

  try {
    const origin = 'https://hilltop-return.invalid';
    const url = new URL(value, origin);
    if (url.origin !== origin || url.username || url.password) return fallback;
    if (!url.pathname.startsWith('/') || /%(?:2f|5c|00|0a|0d)/i.test(url.pathname)) return fallback;
    if (AUTH_ROUTES.has(url.pathname.toLowerCase())) return fallback;
    if (/^(?:\/+)(?:auth|login|logout)(?:\.html)?(?:\/|$)/i.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildSignInUrl(destination?: string | null): string {
  const returnTo = safeReturnPath(destination);
  return `/sign-in.html?${new URLSearchParams({ returnTo }).toString()}`;
}
