import { submitEnquiry } from './services/enquiries';
import type { EnquiryInput } from './types';
import './public-widgets';

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

