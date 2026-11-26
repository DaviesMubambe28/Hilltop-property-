import { safeReturnPath } from './auth-navigation';
import { config } from './config';
import { requireSupabase } from './supabase';
import { resetPassword, signIn, signOut, signUp, updatePassword } from './services/auth';

const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
const feedback = document.querySelector<HTMLElement>('[role="status"]');
const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
const page = document.body.dataset.authPage;

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
      await resetPassword(String(data.get('email')));
      form.reset();
      message('If an account can receive recovery email, a reset link has been sent.');
    } else if (page === 'reset-password') {
      const password = String(data.get('password'));
      if (password !== String(data.get('confirm_password'))) throw new Error('The passwords do not match.');
      const { data: session } = await requireSupabase().auth.getSession();
      if (!session.session) throw new Error('This recovery link is invalid or has expired. Request a new link.');
      const result = await updatePassword(password);
      if (result.error) throw result.error;
      form.reset();
      message('Your password has been updated. You can now continue to your account.');
      window.setTimeout(() => { location.href = '/account.html'; }, 1200);
    } else if (page === 'sign-out') {
      const result = await signOut();
      if (result.error) throw result.error;
      location.href = '/sign-in.html';
    }
  } catch (error) {
    message(error instanceof Error ? error.message : 'The request could not be completed. Please try again.', true);
  } finally {
    setBusy(false);
  }
});
