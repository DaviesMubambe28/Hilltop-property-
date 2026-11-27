import { submitEnquiry } from './services/enquiries';
import type { EnquiryInput } from './types';
import { createSubmissionController } from './lead-submission';
import './public-widgets';

document.querySelectorAll<HTMLFormElement>('[data-public-enquiry]').forEach((form) => {
  const controller = createSubmissionController();
  form.dataset.idempotencyKey = crypto.randomUUID();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const status = form.querySelector<HTMLElement>('[role="status"]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const fingerprint = JSON.stringify(Object.fromEntries(data));
    const attemptKey = controller.begin(fingerprint);
    if (!attemptKey) return;
    form.dataset.idempotencyKey = attemptKey;
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
      controller.finish('confirmed');
      if (status) status.textContent = `Thank you. Your enquiry has been received. A Hilltop Properties representative will contact you. Reference: ${result.id.slice(0, 8)}.`;
      if (button) { button.disabled = false; button.textContent = form.dataset.submitLabel ?? 'Send another enquiry'; }
    } catch (error) {
      controller.finish(error instanceof Error && /could not be confirmed|network|timeout/i.test(error.message) ? 'unknown' : 'rejected');
      if (status) status.textContent = error instanceof Error
        ? error.message
        : 'We could not confirm whether your request was received. Please retry or contact Hilltop.';
      if (button) { button.disabled = false; button.textContent = form.dataset.submitLabel ?? 'Send enquiry'; }
    }
  });
});

