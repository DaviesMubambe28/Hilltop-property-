import { safeReturnPath } from './auth-navigation';
import { config } from './config';
import { requireSupabase } from './supabase';
import { resetPassword, signIn, signOut, signUp, updatePassword } from './services/auth';
import { applyRecoveryEvent, type RecoveryState } from './auth-recovery';

const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
const feedback = document.querySelector<HTMLElement>('[role="status"]');
const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
const page = document.body.dataset.authPage;
let recoveryState: RecoveryState = 'checking';
let recoveryUserId: string | null = null;

function message(text: string, error = false) {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.dataset.error = String(error);
}

function setBusy(busy: boolean) {
  if (submit) submit.disabled = busy;
  if (form) form.setAttribute('aria-busy', String(busy));
}

document.querySelectorAll<HTMLButtonElement>('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector<HTMLInputElement>(`#${button.dataset.togglePassword}`);
    if (!input) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.textContent = visible ? 'Show' : 'Hide';
    button.setAttribute('aria-pressed', String(!visible));
  });
});

if (!config) {
  message('Account services are not connected. Configure the public Supabase URL and anonymous key.', true);
  if (submit) submit.disabled = true;
}

function friendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) return 'The request could not be completed. Please try again.';
  const text = error.message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'The email or password is incorrect.';
  if (text.includes('email rate limit')) return 'Too many requests. Please wait before trying again.';
  if (text.includes('network') || text.includes('fetch')) return 'The authentication service is temporarily unavailable.';
  if (text.includes('password')) return 'The password could not be updated. Choose a valid password and try again.';
  if (text.includes('email')) return 'The email address is invalid or the service could not process it.';
  return 'The request could not be completed. Please try again.';
}

function setRecoveryFormAvailable(available: boolean) {
  if (form) form.hidden = !available;
  if (submit) submit.disabled = !available;
  form?.querySelectorAll<HTMLInputElement>('input').forEach((input) => { input.disabled = !available; });
  form?.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = !available; });
}

if (page === 'reset-password') {
  setRecoveryFormAvailable(false);
  if (!config) {
    recoveryState = 'unavailable';
    message('Account services are not connected. Password recovery is unavailable until authentication services are configured.', true);
  } else {
    const supabase = requireSupabase();
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      const transition = applyRecoveryEvent(
        recoveryState,
        event,
        session?.user?.id ?? null,
        recoveryUserId,
      );
      recoveryState = transition.state;
      recoveryUserId = transition.userId;

      if (recoveryState === 'verified') {
        setRecoveryFormAvailable(true);
        message('Recovery verified. Choose a new password.');
        const url = new URL(location.href);
        ['code', 'type', 'token_hash', 'access_token', 'refresh_token', 'error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
        url.hash = '';
        history.replaceState({}, '', `${url.pathname}${url.search}`);
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

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!config) return;
  setBusy(true);
  message('');
  const data = new FormData(form);
  try {
    if (page === 'sign-in') {
      const result = await signIn(String(data.get('email')), String(data.get('password')));
      if (result.error) throw result.error;
      location.href = safeReturnPath(new URLSearchParams(location.search).get('returnTo'));
    } else if (page === 'sign-up') {
      const password = String(data.get('password'));
      if (password !== String(data.get('confirm_password'))) throw new Error('The passwords do not match.');
      if (data.get('terms') !== 'on') throw new Error('Accept the privacy and terms information to continue.');
      const result = await signUp(String(data.get('email')), password, String(data.get('full_name')));
      if (result.error) throw result.error;
      form.reset();
      message('Account created. Check your email to confirm your address, then sign in.');
    } else if (page === 'forgot-password') {
      const result = await resetPassword(String(data.get('email')));
      if (result.error) throw result.error;
      form.reset();
      message('If an account exists for this email address, password reset instructions will be sent.');
    } else if (page === 'reset-password') {
      const password = String(data.get('password'));
      if (password !== String(data.get('confirm_password'))) throw new Error('The passwords do not match.');
      if (password.length < 8) throw new Error('The password must be at least 8 characters.');
      if (recoveryState !== 'verified' || !recoveryUserId) throw new Error('This recovery link is invalid or has expired. Request a new link.');
      const expectedUserId = recoveryUserId;
      recoveryState = 'submitting';
      setBusy(true);
      setRecoveryFormAvailable(false);
      const { data: userData, error: userError } = await requireSupabase().auth.getUser();
      if (userError || !userData.user || userData.user.id !== expectedUserId || recoveryUserId !== expectedUserId) {
        recoveryUserId = null;
        recoveryState = 'invalid';
        setRecoveryFormAvailable(false);
        throw new Error('Your recovery session is no longer valid.');
      }
      const result = await updatePassword(password);
      if (result.error) throw result.error;
      form.reset();
      recoveryUserId = null;
      recoveryState = 'completed';
      setRecoveryFormAvailable(false);
      message('Your password has been updated. Sign in again to continue.');
      window.setTimeout(() => { location.href = '/sign-in.html'; }, 1200);
    } else if (page === 'sign-out') {
      const result = await signOut();
      if (result.error) throw result.error;
      location.href = '/sign-in.html';
    }
  } catch (error) {
    if (page === 'reset-password' && recoveryState === 'submitting') {
      recoveryState = recoveryUserId ? 'verified' : 'invalid';
      setRecoveryFormAvailable(recoveryState === 'verified');
    }
    message(friendlyAuthError(error), true);
  } finally {
    setBusy(false);
  }
});
