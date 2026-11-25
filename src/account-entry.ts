import { config } from './config';

const main = document.querySelector<HTMLElement>('.account-main');

if (!config) {
  if (main) main.innerHTML = `<section class="portal-state"><p class="eyebrow">My Hilltop</p><h1>Account services are not connected.</h1><p>This deployment needs its public Supabase environment variables before sign-in, saved properties and customer services can be used.</p><div><a class="button button-yellow" href="/">Return home</a><a class="button button-dark" href="/contact.html">Contact Hilltop</a></div></section>`;
  document.querySelector<HTMLButtonElement>('#account-signout')?.remove();
} else {
  void import('./account');
}
