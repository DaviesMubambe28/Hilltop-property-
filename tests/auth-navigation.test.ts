import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '../src/auth-navigation';

describe('authentication return paths', () => {
  it('accepts internal paths', () => expect(safeReturnPath('/property/example?from=saved')).toBe('/property/example?from=saved'));
  it('rejects external and protocol-relative redirects', () => {
    expect(safeReturnPath('https://evil.example')).toBe('/account.html');
    expect(safeReturnPath('//evil.example/path')).toBe('/account.html');
  });
});
