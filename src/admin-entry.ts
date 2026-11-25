import { config } from './config';

const layout = document.querySelector<HTMLElement>('.admin-layout');

if (!config) {
  if (layout) layout.innerHTML = `<main class="portal-state staff-state"><p class="eyebrow">Hilltop staff CMS</p><h1>Connect the staff workspace.</h1><p>Public Supabase environment variables are required before staff authentication and authorised operational data can load.</p><div><a class="button button-yellow" href="/">View public website</a></div></main>`;
  document.querySelector<HTMLButtonElement>('#admin-signout')?.remove();
} else {
  void import('./admin');
}
