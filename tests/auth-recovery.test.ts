import { describe, expect, it } from 'vitest';
import { applyRecoveryEvent } from '../src/auth-recovery';

describe('password recovery state', () => {
  it('does not unlock for ordinary sign-in', () => {
    expect(applyRecoveryEvent('checking', 'SIGNED_IN', 'user-1', null)).toEqual({ state: 'invalid', userId: null });
  });

  it('does not unlock for initial session', () => {
    expect(applyRecoveryEvent('checking', 'INITIAL_SESSION', 'user-1', null)).toEqual({ state: 'invalid', userId: null });
  });

  it('unlocks only for PASSWORD_RECOVERY with a user', () => {
    expect(applyRecoveryEvent('checking', 'PASSWORD_RECOVERY', 'user-1', null)).toEqual({ state: 'verified', userId: 'user-1' });
    expect(applyRecoveryEvent('checking', 'PASSWORD_RECOVERY', null, null)).toEqual({ state: 'checking', userId: null });
  });

  it('invalidates recovery on sign-out', () => {
    expect(applyRecoveryEvent('verified', 'SIGNED_OUT', null, 'user-1')).toEqual({ state: 'invalid', userId: null });
  });

  it('invalidates recovery when the user changes', () => {
    expect(applyRecoveryEvent('verified', 'SIGNED_IN', 'user-2', 'user-1')).toEqual({ state: 'invalid', userId: null });
  });

  it('preserves a matching recovery user through token refresh', () => {
    expect(applyRecoveryEvent('verified', 'TOKEN_REFRESHED', 'user-1', 'user-1')).toEqual({ state: 'verified', userId: 'user-1' });
  });
});
