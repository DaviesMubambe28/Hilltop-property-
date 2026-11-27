export type AccountAccessStage =
  | 'auth-user'
  | 'profile-read'
  | 'account-import'
  | 'account-initialize';

export class AccountAccessError extends Error {
  readonly stage: AccountAccessStage;
  readonly code: string;
  readonly status?: number;

  constructor(stage: AccountAccessStage, cause?: unknown, status?: number) {
    super('Account access could not be completed.');
    this.name = 'AccountAccessError';
    this.stage = stage;
    const details = cause && typeof cause === 'object'
      ? cause as Record<string, unknown>
      : {};
    this.code = typeof details.code === 'string' && /^[a-z0-9_]{1,80}$/i.test(details.code)
      ? details.code
      : 'unknown';
    const responseStatus = status ?? (typeof details.status === 'number' ? details.status : undefined);
    this.status = typeof responseStatus === 'number' && Number.isInteger(responseStatus)
      ? responseStatus
      : undefined;
  }
}

export function reportAccountFailure(stage: AccountAccessStage, error: unknown): void {
  if (!import.meta.env.DEV) return;
  const diagnostic = error instanceof AccountAccessError
    ? error
    : new AccountAccessError(stage, error);
  console.warn('[Hilltop Account]', {
    stage: diagnostic.stage,
    code: diagnostic.code,
    status: diagnostic.status,
  });
}
