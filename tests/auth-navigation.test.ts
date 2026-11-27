import { describe, expect, it } from 'vitest';
import { safeReturnPath, buildSignInUrl } from '../src/auth-navigation';

describe('authentication return paths', () => {
  it('accepts internal paths', () => expect(safeReturnPath('/property/example?from=saved')).toBe('/property/example?from=saved'));
  it('rejects external and protocol-relative redirects', () => {
    expect(safeReturnPath('https://evil.example')).toBe('/account.html');
    expect(safeReturnPath('//evil.example/path')).toBe('/account.html');
  });
  it.each([
    'https://malicious.example',
    'http://malicious.example',
    '//malicious.example',
    '///malicious.example',
    '/\\malicious.example',
    'javascript:alert(1)',
    'data:text/html,test',
    '/%2f%2fmalicious.example',
    '/%5cmalicious.example',
    '/sign-in.html',
    '/reset-password.html',
  ])('rejects unsafe destination %s', (destination) => {
    expect(safeReturnPath(destination)).toBe('/account.html');
  });
  it.each([
    '/',
    '/account.html',
    '/properties.html',
    '/properties.html?listing=sale',
    '/properties.html?listing=rent&city=Lusaka',
    '/property/example-property',
    '/contact.html',
    '/about.html',
    '/sell.html',
    '/resources.html#tools',
  ])('preserves destination %s', (destination) => {
    expect(safeReturnPath(destination)).toBe(destination);
  });
  it('builds a sign-in URL with an encoded return destination', () => {
    const url = new URL(buildSignInUrl('/properties.html?listing=rent&city=Lusaka'), 'https://hilltop.invalid');
    expect(url.pathname).toBe('/sign-in.html');
    expect(url.searchParams.get('returnTo')).toBe('/properties.html?listing=rent&city=Lusaka');
  });
});
