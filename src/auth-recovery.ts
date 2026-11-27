export type RecoveryState =
  | 'checking'
  | 'verified'
  | 'invalid'
  | 'submitting'
  | 'completed'
  | 'unavailable'
  | 'error';

export function applyRecoveryEvent(
  state: RecoveryState,
  event: string,
  sessionUserId: string | null,
  verifiedUserId: string | null,
): { state: RecoveryState; userId: string | null } {
  if (state === 'completed' || state === 'submitting') {
    return { state, userId: verifiedUserId };
  }

  if (state === 'invalid' || state === 'unavailable' || state === 'error') {
    if (event === 'PASSWORD_RECOVERY' && sessionUserId) {
      return { state: 'verified', userId: sessionUserId };
    }
    return { state, userId: null };
  }

  if (event === 'PASSWORD_RECOVERY' && sessionUserId) {
    return { state: 'verified', userId: sessionUserId };
  }

  if (event === 'SIGNED_OUT') {
    return { state: 'invalid', userId: null };
  }

  if (verifiedUserId && sessionUserId && sessionUserId !== verifiedUserId) {
    return { state: 'invalid', userId: null };
  }

  if (
    state === 'verified' &&
    (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
    sessionUserId === verifiedUserId
  ) {
    return { state: 'verified', userId: verifiedUserId };
  }

  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
    return verifiedUserId
      ? { state: 'verified', userId: verifiedUserId }
      : { state: 'invalid', userId: null };
  }

  return { state, userId: verifiedUserId };
}
