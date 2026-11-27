import { expect, test } from '@playwright/test';
import { demoProperty } from '../src/demo-property';

test.describe('Mocked lead generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://hilltop-test.invalid/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/functions/v1/submit-enquiry')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '70000000-0000-4000-8000-000000000099', duplicate: false }),
        });
        return;
      }
      if (url.includes('/functions/v1/submit-viewing')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '71000000-0000-4000-8000-000000000099', status: 'requested' }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.includes('/properties?') ? demoProperty : []) });
    });
  });

  test('property enquiry confirms persistence and prevents rapid duplicate submit', async ({ page }) => {
    let requests = 0;
    await page.route('https://hilltop-test.invalid/functions/v1/submit-enquiry', async (route) => {
      requests++;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '70000000-0000-4000-8000-000000000099' }),
      });
    });
    await page.goto('/property/demo-kabulonga-family-house');
    await page.getByRole('button', { name: 'Enquire', exact: true }).click();
    await page.locator('#detail-enquiry').getByLabel('Name').fill('Synthetic Customer');
    await page.locator('#detail-enquiry').getByLabel('Email').fill('synthetic@example.invalid');
    await page.locator('#detail-enquiry').getByLabel('Message').fill('I would like more information about this demonstration property.');
    await page.locator('#detail-enquiry').getByLabel('I consent').check();
    await page.locator('#detail-enquiry').getByRole('button', { name: 'Send enquiry' }).dblclick();
    await expect(page.locator('#detail-enquiry [role="status"]')).toContainText('enquiry has been received');
    expect(requests).toBe(1);
  });

  test('malformed enquiry success response remains unconfirmed', async ({ page }) => {
    await page.route('https://hilltop-test.invalid/functions/v1/submit-enquiry', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );
    await page.goto('/contact.html');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Name').fill('Synthetic Customer');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Email').fill('synthetic@example.invalid');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Message').fill('Please provide synthetic general assistance.');
    await page.locator('form[data-public-enquiry="general"]').getByLabel(/consent/i).check();
    await page.locator('form[data-public-enquiry="general"]').getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('form[data-public-enquiry="general"] [role="status"]')).toContainText(/could not be confirmed|could not be submitted/i);
  });

  test('failed enquiry reports a recoverable error', async ({ page }) => {
    await page.route('https://hilltop-test.invalid/functions/v1/submit-enquiry', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again later.' } }),
      }),
    );
    await page.goto('/contact.html');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Name').fill('Synthetic Customer');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Email').fill('synthetic@example.invalid');
    await page.locator('form[data-public-enquiry="general"]').getByLabel('Message').fill('Please provide synthetic general assistance.');
    await page.locator('form[data-public-enquiry="general"]').getByLabel(/consent/i).check();
    await page.locator('form[data-public-enquiry="general"]').getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('form[data-public-enquiry="general"] [role="status"]')).toContainText(/try again|retry|contact Hilltop/i);
  });

  test('physical viewing request is stored as requested, not confirmed', async ({ page }) => {
    await page.route('https://hilltop-test.invalid/functions/v1/submit-viewing', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '71000000-0000-4000-8000-000000000099', status: 'requested' }),
      }),
    );
    await page.goto('/property/demo-kabulonga-family-house');
    await page.locator('.enquiry-sidebar').getByRole('button', { name: 'Request viewing', exact: true }).click();
    await page.locator('#detail-viewing').getByLabel('Name').fill('Synthetic Customer');
    await page.locator('#detail-viewing').getByLabel('Email').fill('synthetic@example.invalid');
    await page.locator('#detail-viewing').getByLabel(/Preferred date and time/).fill('2027-01-15T14:30');
    await page.locator('#detail-viewing').getByLabel('I consent').check();
    await page.locator('#detail-viewing').getByRole('button', { name: 'Request viewing' }).click();
    await expect(page.locator('#detail-viewing [role="status"]')).toContainText('will contact you to confirm availability');
  });

  test('spoofed success is not treated as persistence', async ({ page }) => {
    await page.route('https://hilltop-test.invalid/functions/v1/submit-viewing', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'confirmed' }) }),
    );
    await page.goto('/property/demo-kabulonga-family-house');
    await page.locator('.enquiry-sidebar').getByRole('button', { name: 'Request viewing', exact: true }).click();
    await page.locator('#detail-viewing').getByLabel('Name').fill('Synthetic Customer');
    await page.locator('#detail-viewing').getByLabel('Email').fill('synthetic@example.invalid');
    await page.locator('#detail-viewing').getByLabel(/Preferred date and time/).fill('2027-01-15T14:30');
    await page.locator('#detail-viewing').getByLabel('I consent').check();
    await page.locator('#detail-viewing').getByRole('button', { name: 'Request viewing' }).click();
    await expect(page.locator('#detail-viewing [role="status"]')).toContainText('could not be confirmed');
  });
});
