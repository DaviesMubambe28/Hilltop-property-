import { config } from './config';

const main = document.querySelector<HTMLElement>('.account-main');

if (!config) {
  if (main) main.innerHTML = `<section class="portal-state"><p class="eyebrow">My Hilltop</p><h1>Account services are not connected.</h1><p>Sign-in, saved properties and account services are temporarily unavailable. You can still browse property and contact Hilltop for assistance.</p><div><a class="button button-yellow" href="/">Return home</a><a class="button button-dark" href="/contact.html">Contact Hilltop</a></div></section>`;
  document.querySelector<HTMLButtonElement>('#account-signout')?.remove();
} else {
  void import('./account');
}
