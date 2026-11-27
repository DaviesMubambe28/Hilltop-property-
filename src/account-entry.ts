import { config } from './config';
import { buildSignInUrl } from './auth-navigation';
import { currentProfile } from './services/auth';

const main = document.querySelector<HTMLElement>('.account-main');
if (main) main.hidden = true;

if (!config) {
  if (main) main.innerHTML = `<section class="portal-state"><p class="eyebrow">My Hilltop</p><h1>Account services are not connected.</h1><p>Sign-in, saved properties and account services are temporarily unavailable. You can still browse property and contact Hilltop for assistance.</p><div><a class="button button-yellow" href="/">Return home</a><a class="button button-dark" href="/contact.html">Contact Hilltop</a></div></section>`;
  if (main) main.hidden = false;
  document.querySelector<HTMLButtonElement>('#account-signout')?.remove();
} else {
  void (async () => {
    try {
      const session = await currentProfile();
      if (!session) {
        location.replace(buildSignInUrl('/account.html'));
        return;
      }
      if (main) main.hidden = false;
      await import('./account');
    } catch {
      if (main) {
        main.hidden = false;
        main.innerHTML = `<section class="portal-state"><p class="eyebrow">My Hilltop</p><h1>Account information is temporarily unavailable.</h1><p>We could not verify this account session. Sign in again or return to the public website.</p><div><a class="button button-yellow" href="/sign-in.html?returnTo=%2Faccount.html">Sign in</a><a class="button button-dark" href="/">Return home</a></div></section>`;
      }
      document.querySelector<HTMLButtonElement>('#account-signout')?.remove();
    }
  })();
}
