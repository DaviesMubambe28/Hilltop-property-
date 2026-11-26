import { submitEnquiry } from './services/enquiries';
import type { EnquiryInput } from './types';
import './public-widgets';

const menuButton = document.querySelector<HTMLButtonElement>('.menu-button');
const mobileMenu = document.querySelector<HTMLElement>('#mobile-menu');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (mobileMenu) mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  if (mobileMenu) mobileMenu.hidden = true;
  menuButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

document.querySelectorAll<HTMLFormElement>('[data-public-enquiry]').forEach((form) => {
  form.dataset.idempotencyKey = crypto.randomUUID();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const status = form.querySelector<HTMLElement>('[role="status"]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button?.disabled) return;
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    try {
      const type = form.dataset.publicEnquiry as EnquiryInput['type'];
      const result = await submitEnquiry({
        type,
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        message: String(data.get('message') ?? ''),
        consent: data.get('consent') === 'on',
        idempotencyKey: form.dataset.idempotencyKey ?? crypto.randomUUID(),
        website: String(data.get('website') ?? ''),
      });
      form.reset();
      form.dataset.idempotencyKey = crypto.randomUUID();
      if (status) status.textContent = `Thank you. Your reference is ${result.id.slice(0, 8)}. Our team will contact you.`;
      if (button) { button.disabled = false; button.textContent = form.dataset.submitLabel ?? 'Send another enquiry'; }
    } catch {
      if (status) status.textContent = 'Your enquiry was not sent. Please try again or contact Hilltop directly.';
      if (button) { button.disabled = false; button.textContent = form.dataset.submitLabel ?? 'Send enquiry'; }
    }
  });
});

// Close mobile navigation predictably with the keyboard.
document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
    mobileMenu.hidden=true; menuButton?.setAttribute('aria-expanded','false'); menuButton?.setAttribute('aria-label','Open menu'); document.body.classList.remove('menu-open'); menuButton?.focus();
  }
});
