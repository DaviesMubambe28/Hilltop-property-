import { describe, expect, it } from 'vitest';
import {
  safeReturnPath,
  buildSignInUrl,
  buildSignUpUrl,
  buildRegistrationSignInUrl,
  buildAccountSignInUrl,
  resolveAuthReturnPath,
} from '../src/auth-navigation';

describe('authentication return paths', () => {
  it('accepts internal paths', () => expect(safeReturnPath('/property/example?from=saved')).toBe('/property/example?from=saved'));
  it('rejects external and protocol-relative redirects', () => {
    expect(safeReturnPath('https://evil.example')).toBe('/account.html');
    expect(safeReturnPath('//evil.example/path')).toBe('/account.html');
  });

  describe('registration navigation', () => {
    it('preserves the original property destination', () => {
      const url = new URL(buildRegistrationSignInUrl('/property/example-property', 'complete'), 'https://hilltop.invalid');
      expect(url.pathname).toBe('/sign-in.html');
      expect(url.searchParams.get('returnTo')).toBe('/property/example-property');
      expect(url.searchParams.get('registration')).toBe('complete');
    });
    it('rejects unsafe registration return paths', () => {
      const url = new URL(buildRegistrationSignInUrl('https://malicious.example', 'check-email'), 'https://hilltop.invalid');
      expect(url.searchParams.get('returnTo')).toBe('/account.html');
    });
    it('preserves return paths when opening registration', () => {
      const url = new URL(buildSignUpUrl('/properties.html?listing=rent'), 'https://hilltop.invalid');
      expect(url.pathname).toBe('/sign-up.html');
      expect(url.searchParams.get('returnTo')).toBe('/properties.html?listing=rent');
    });
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

  describe('customer authentication destinations', () => {
    it('opens My Account from general account entry', () => {
      const url = new URL(buildAccountSignInUrl(), 'https://hilltop.invalid');
      expect(url.pathname).toBe('/sign-in.html');
      expect(url.searchParams.get('returnTo')).toBe('/account.html');
    });
    it('defaults direct sign-in to the account', () => {
      expect(resolveAuthReturnPath(null)).toBe('/account.html');
    });
    it('corrects a legacy homepage destination', () => {
      expect(resolveAuthReturnPath('/')).toBe('/account.html');
    });
    it('preserves a property-specific destination', () => {
      expect(resolveAuthReturnPath('/property/example')).toBe('/property/example');
    });
    it('preserves a filtered catalogue destination', () => {
      expect(resolveAuthReturnPath('/properties.html?listing=rent')).toBe('/properties.html?listing=rent');
    });
    it('rejects an external return destination', () => {
      expect(resolveAuthReturnPath('https://malicious.example')).toBe('/account.html');
    });
  });
});
