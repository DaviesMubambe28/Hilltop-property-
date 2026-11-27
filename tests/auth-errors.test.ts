import { describe, expect, it } from 'vitest';
import { AuthFormError, friendlyAuthError, authErrorDiagnostic } from '../src/auth-errors';

describe('authentication error messages', () => {
  it('maps invalid credentials accurately', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials', status: 400 })).toContain('email or password is incorrect');
  });
  it('does not classify unconfirmed email as invalid', () => {
    expect(friendlyAuthError({ code: 'email_not_confirmed', status: 400 })).toContain('confirm your email');
  });
  it('preserves password mismatch validation', () => {
    expect(friendlyAuthError(new AuthFormError('The passwords do not match.'), 'sign-up')).toBe('The passwords do not match.');
  });
  it('handles restricted email delivery', () => {
    expect(friendlyAuthError({ code: 'email_address_not_authorized' })).toContain('delivery is currently restricted');
  });
  it('handles rate limiting', () => {
    expect(friendlyAuthError({ status: 429 })).toContain('Too many requests');
  });
  it('handles service outages', () => {
    expect(friendlyAuthError({ status: 503 })).toContain('temporarily unavailable');
  });
  it('does not expose arbitrary internal errors', () => {
    expect(friendlyAuthError(new Error('Internal database failure: private diagnostic'))).not.toContain('private diagnostic');
  });
  it('returns sanitized diagnostics only', () => {
    expect(authErrorDiagnostic({
      code: 'invalid_credentials',
      status: 400,
      message: 'private message',
      access_token: 'private token',
    })).toEqual({ code: 'invalid_credentials', status: 400 });
  });
});
