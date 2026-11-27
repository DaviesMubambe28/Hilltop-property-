import { describe, expect, it } from 'vitest';
import { AccountAccessError } from '../src/account-access';

describe('account access diagnostics', () => {
  it('identifies profile permission failures', () => {
    const error = new AccountAccessError(
      'profile-read',
      { code: '42501', status: 403 },
    );
    expect(error.stage).toBe('profile-read');
    expect(error.code).toBe('42501');
    expect(error.status).toBe(403);
  });

  it('identifies unavailable profile rows', () => {
    const error = new AccountAccessError(
      'profile-read',
      { code: 'profile_unavailable' },
    );
    expect(error.code).toBe('profile_unavailable');
  });

  it('distinguishes authentication failures', () => {
    const error = new AccountAccessError(
      'auth-user',
      { code: 'invalid_jwt', status: 401 },
    );
    expect(error.stage).toBe('auth-user');
    expect(error.status).toBe(401);
  });
});
