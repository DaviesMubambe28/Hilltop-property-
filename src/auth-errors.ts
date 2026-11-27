export type AuthOperation = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'sign-out';

export class AuthFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFormError';
  }
}

interface AuthErrorDetails {
  code?: string;
  status?: number;
  name?: string;
  message?: string;
}

function readAuthError(error: unknown): AuthErrorDetails {
  if (!error || typeof error !== 'object') return {};
  const value = error as Record<string, unknown>;
  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    status: typeof value.status === 'number' ? value.status : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  };
}

export function friendlyAuthError(error: unknown, operation: AuthOperation = 'sign-in'): string {
  if (error instanceof AuthFormError) return error.message;
  const details = readAuthError(error);
  switch (details.code) {
    case 'invalid_credentials': return 'The email or password is incorrect. Please try again.';
    case 'email_not_confirmed': return 'Please confirm your email address before signing in.';
    case 'email_address_invalid': return 'This email address cannot be used. Check the address and try again.';
    case 'email_address_not_authorized': return 'Email delivery is currently restricted. Please contact Hilltop for assistance.';
    case 'weak_password': return 'Choose a stronger password that meets the password requirements.';
    case 'user_already_exists':
    case 'email_exists': return 'If you already have an account, sign in or request a password reset.';
    case 'signup_disabled': return 'Account registration is currently unavailable.';
    case 'email_provider_disabled': return 'Email authentication is currently unavailable.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'Too many requests. Please wait before trying again.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found': return 'This link is invalid or has expired. Request a new link.';
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found': return 'Your session has expired. Please sign in again.';
    case 'same_password': return 'Choose a password that is different from your current password.';
  }
  if (details.status === 429) return 'Too many requests. Please wait before trying again.';
  const text = details.message?.toLowerCase() ?? '';
  if (details.name === 'AuthRetryableFetchError' || (details.status !== undefined && details.status >= 500) || text.includes('failed to fetch') || text.includes('network error')) {
    return 'The authentication service is temporarily unavailable. Please try again.';
  }
  if (text.includes('invalid login credentials')) return 'The email or password is incorrect. Please try again.';
  if (text.includes('email not confirmed')) return 'Please confirm your email address before signing in.';
  if (text.includes('email rate limit')) return 'Too many requests. Please wait before trying again.';
  switch (operation) {
    case 'sign-up': return 'We could not complete registration. Please try again.';
    case 'forgot-password': return 'We could not process your recovery request. Please try again.';
    case 'reset-password': return 'We could not update your password. Please try again.';
    case 'sign-out': return 'We could not sign you out. Please try again.';
    default: return 'We could not sign you in. Please try again.';
  }
}

export function authErrorDiagnostic(error: unknown) {
  const details = readAuthError(error);
  return {
    code: details.code && /^[a-z0-9_]{1,80}$/i.test(details.code) ? details.code : 'unknown',
    status: Number.isInteger(details.status) ? details.status : undefined,
  };
}
