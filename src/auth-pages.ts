import {
  buildSignInUrl,
  buildSignUpUrl,
  buildRegistrationSignInUrl,
  resolveAuthReturnPath,
} from './auth-navigation';
import { config } from './config';
import { requireSupabase } from './supabase';
import {
  resetPassword,
  signIn,
  signOut,
  signUp,
  signOutCurrentSession,
  updatePassword,
} from './services/auth';
import { applyRecoveryEvent, type RecoveryState } from './auth-recovery';
import {
  AuthFormError,
  friendlyAuthError,
  authErrorDiagnostic,
  type AuthOperation,
} from './auth-errors';

const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
const feedback = document.querySelector<HTMLElement>('[role="status"]');
const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
const page = document.body.dataset.authPage;
const params = new URLSearchParams(location.search);
const returnTo = resolveAuthReturnPath(params.get('returnTo'));

let recoveryState: RecoveryState = 'checking';
let recoveryUserId: string | null = null;
let submissionInProgress = false;
let navigationPending = false;
let registrationCleanupPending = false;

function message(text: string, error = false) {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.dataset.error = String(error);
}

function originalSubmitLabel() {
  if (!submit) return '';
  if (page === 'sign-in') return 'Sign in';
  if (page === 'sign-up') return 'Create account';
  if (page === 'forgot-password') return 'Send recovery link';
  if (page === 'reset-password') return 'Update password';
  return 'Confirm sign out';
}

function setBusy(busy: boolean) {
  submissionInProgress = busy;
  if (submit) submit.disabled = busy || !config;
  form?.setAttribute('aria-busy', String(busy));
  if (submit) submit.textContent = busy
    ? page === 'sign-in'
      ? 'Signing in…'
      : page === 'sign-up'
        ? 'Creating account…'
        : page === 'forgot-password'
          ? 'Sending recovery link…'
          : page === 'reset-password'
            ? 'Updating password…'
            : 'Signing out…'
    : originalSubmitLabel();
}

function setRecoveryFormAvailable(available: boolean) {
  if (form) form.hidden = !available;
  if (submit) submit.disabled = !available;
  form?.querySelectorAll<HTMLInputElement>('input').forEach((input) => { input.disabled = !available; });
  form?.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = !available; });
}

document.querySelectorAll<HTMLButtonElement>('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector<HTMLInputElement>(`#${button.dataset.togglePassword}`);
    if (!input) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.textContent = visible ? 'Show' : 'Hide';
    button.setAttribute('aria-pressed', String(!visible));
    button.setAttribute('aria-label', visible ? 'Reveal characters' : 'Hide characters');
  });
});

document.querySelectorAll<HTMLAnchorElement>('[data-auth-sign-up]').forEach((link) => {
  link.href = buildSignUpUrl(returnTo);
});

document.querySelectorAll<HTMLAnchorElement>('[data-auth-sign-in]').forEach((link) => {
  link.href = buildSignInUrl(returnTo);
});

function showRegistrationNotice() {
  if (page !== 'sign-in' || !config) return;
  const notice = params.get('registration');
  if (notice === 'complete') {
    message('Registration complete. Please sign in to continue.');
  } else if (notice === 'check-email') {
    message('If your registration was accepted, check your email to confirm your account before signing in.');
  }
  if (notice) {
    const url = new URL(location.href);
    url.searchParams.delete('registration');
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

function showRegistrationCleanupRetry() {
  if (!form) return;
  let retry = document.querySelector<HTMLButtonElement>('[data-registration-cleanup]');
  if (retry) return;
  retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button button-dark';
  retry.dataset.registrationCleanup = '';
  retry.textContent = 'Continue to sign in';
  retry.addEventListener('click', async () => {
    if (!retry || retry.disabled) return;
    retry.disabled = true;
    try {
      await signOutCurrentSession();
      registrationCleanupPending = false;
      navigationPending = true;
      location.replace(buildRegistrationSignInUrl(returnTo, 'complete'));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Hilltop Auth] registration cleanup retry', authErrorDiagnostic(error));
      }
      message('Session cleanup is still unavailable. Please try again.', true);
      retry.disabled = false;
    }
  });
  form.after(retry);
}

function showPasswordCleanupRetry() {
  if (!form) return;
  let retry = document.querySelector<HTMLButtonElement>('[data-password-cleanup]');
  if (retry) return;
  retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button button-dark';
  retry.dataset.passwordCleanup = '';
  retry.textContent = 'Continue to sign in';
  retry.addEventListener('click', async () => {
    if (!retry || retry.disabled) return;
    retry.disabled = true;
    try {
      await signOutCurrentSession();
      navigationPending = true;
      location.replace(buildSignInUrl(returnTo));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Hilltop Auth] password cleanup retry', authErrorDiagnostic(error));
      }
      message('Session cleanup is still unavailable. Please try again.', true);
      retry.disabled = false;
    }
  });
  form.after(retry);
}

if (!config) {
  message('Account services are not connected. Configure the public Supabase URL and anonymous key.', true);
  if (submit) submit.disabled = true;
} else if (page !== 'reset-password') {
  if (form) form.hidden = false;
}

showRegistrationNotice();

if (page === 'reset-password') {
  setRecoveryFormAvailable(false);
  if (!config) {
    recoveryState = 'unavailable';
    message('Account services are not connected. Password recovery is unavailable until authentication services are configured.', true);
  } else {
    const supabase = requireSupabase();
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      const transition = applyRecoveryEvent(recoveryState, event, session?.user?.id ?? null, recoveryUserId);
      recoveryState = transition.state;
      recoveryUserId = transition.userId;
      if (recoveryState === 'verified') {
        setRecoveryFormAvailable(true);
        message('Recovery verified. Choose a new password.');
      } else if (recoveryState === 'invalid') {
        setRecoveryFormAvailable(false);
        message('This recovery link is invalid or has expired. Request a new link.', true);
      }
    });

    window.setTimeout(() => {
      if (recoveryState === 'checking') {
        recoveryState = 'invalid';
        setRecoveryFormAvailable(false);
        message('This recovery link is invalid or has expired. Request a new link.', true);
      }
    }, 2500);

    window.addEventListener('beforeunload', () => authSubscription.subscription.unsubscribe(), { once: true });
  }
}

if (page === 'sign-in' && config) {
  const hasCallback = params.has('code') || params.has('token_hash') || params.has('access_token') || params.has('error');
  const isSignupConfirmation = params.get('confirmation') === 'signup';
  if (hasCallback) {
    const supabase = requireSupabase();
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (isSignupConfirmation && event === 'SIGNED_IN' && session?.user) {
        void signOutCurrentSession().catch((error) => {
          if (import.meta.env.DEV) console.warn('[Hilltop Auth] confirmation cleanup', authErrorDiagnostic(error));
        });
        message('Email confirmation received. Please sign in to continue.');
      }
    });
    window.addEventListener('beforeunload', () => authSubscription.subscription.unsubscribe(), { once: true });
  }

  const sensitiveKeys = ['code', 'token_hash', 'access_token', 'refresh_token', 'type', 'error', 'error_code', 'error_description', 'confirmation'];
  if (hasCallback || params.has('confirmation')) {
    window.setTimeout(() => {
      const url = new URL(location.href);
      sensitiveKeys.forEach((key) => url.searchParams.delete(key));
      url.hash = '';
      history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }, 0);
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!config || submissionInProgress || navigationPending) return;
  setBusy(true);
  message('');
  const data = new FormData(form);

  try {
    if (page === 'sign-in') {
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');
      if (!email) throw new AuthFormError('Enter your email address.');
      if (!password) throw new AuthFormError('Enter your password.');
      const result = await signIn(email, password);
      if (result.error) throw result.error;
      if (!result.data.session || !result.data.user || result.data.session.user.id !== result.data.user.id) {
        throw new AuthFormError('We could not establish your session. Please try again.');
      }
      navigationPending = true;
      form.reset();
      message('Signed in successfully.');
      location.replace(returnTo);
    } else if (page === 'sign-up') {
      const fullName = String(data.get('full_name') ?? '').trim();
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');
      const confirmPassword = String(data.get('confirm_password') ?? '');
      if (fullName.length < 2 || fullName.length > 120) throw new AuthFormError('Enter your full name.');
      if (!email) throw new AuthFormError('Enter your email address.');
      if (password.length < 8) throw new AuthFormError('Your password must contain at least 8 characters.');
      if (password !== confirmPassword) throw new AuthFormError('The passwords do not match.');
      if (data.get('terms') !== 'on') throw new AuthFormError('Accept the privacy and terms information to continue.');

      const existing = await requireSupabase().auth.getSession();
      if (existing.error) throw existing.error;
      if (existing.data.session) {
        throw new AuthFormError('You are already signed in. Sign out or return to your account before creating another account.');
      }

      const result = await signUp(email, password, fullName, returnTo);
      if (result.error) throw result.error;
      if (!result.data.user) throw new AuthFormError('We could not complete registration. Please try again.');

      const notice = result.data.session ? 'complete' : 'check-email';
      if (result.data.session) {
        registrationCleanupPending = true;
        form.reset();
        try {
          await signOutCurrentSession();
          registrationCleanupPending = false;
        } catch (error) {
          if (import.meta.env.DEV) console.warn('[Hilltop Auth] registration session cleanup', authErrorDiagnostic(error));
          message('Your registration was accepted, but we could not end the automatic session. Please retry session cleanup before signing in.', true);
          showRegistrationCleanupRetry();
          return;
        }
      }
      navigationPending = true;
      form.reset();
      location.replace(buildRegistrationSignInUrl(returnTo, notice));
    } else if (page === 'forgot-password') {
      const email = String(data.get('email') ?? '').trim();
      if (!email) throw new AuthFormError('Enter your email address.');
      const result = await resetPassword(email);
      if (result.error) throw result.error;
      form.reset();
      message('If an account exists for this email address, password reset instructions will be sent.');
    } else if (page === 'reset-password') {
      const password = String(data.get('password') ?? '');
      const confirmPassword = String(data.get('confirm_password') ?? '');
      if (password !== confirmPassword) throw new AuthFormError('The passwords do not match.');
      if (password.length < 8) throw new AuthFormError('The password must be at least 8 characters.');
      if (recoveryState !== 'verified' || !recoveryUserId) {
        throw new AuthFormError('This recovery link is invalid or has expired. Request a new link.');
      }
      const expectedUserId = recoveryUserId;
      recoveryState = 'submitting';
      setRecoveryFormAvailable(false);
      const { data: userData, error: userError } = await requireSupabase().auth.getUser();
      if (userError || !userData.user || userData.user.id !== expectedUserId || recoveryUserId !== expectedUserId) {
        recoveryUserId = null;
        recoveryState = 'invalid';
        setRecoveryFormAvailable(false);
        throw new AuthFormError('Your recovery session is no longer valid.');
      }
      const result = await updatePassword(password);
      if (result.error) throw result.error;
      form.reset();
      recoveryUserId = null;
      recoveryState = 'completed';
      setRecoveryFormAvailable(false);
      message('Your password has been updated. Sign in again to continue.');
      try {
        await signOutCurrentSession();
        navigationPending = true;
        location.replace(buildSignInUrl(returnTo));
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[Hilltop Auth] password cleanup', authErrorDiagnostic(error));
        message('Your password was updated, but session cleanup is unavailable. Please continue to sign in.', true);
        showPasswordCleanupRetry();
      }
    } else if (page === 'sign-out') {
      const result = await signOut();
      if (result.error) throw result.error;
      navigationPending = true;
      location.replace('/sign-in.html');
    }
  } catch (error) {
    if (page === 'reset-password' && recoveryState === 'submitting') {
      recoveryState = recoveryUserId ? 'verified' : 'invalid';
      setRecoveryFormAvailable(recoveryState === 'verified');
    }
    if (import.meta.env.DEV) console.warn('[Hilltop Auth]', page, authErrorDiagnostic(error));
    message(friendlyAuthError(error, page as AuthOperation), true);
  } finally {
    if (!navigationPending && !registrationCleanupPending) {
      setBusy(false);
      if (page === 'reset-password') {
        setRecoveryFormAvailable(recoveryState === 'verified');
      }
    }
  }
});
