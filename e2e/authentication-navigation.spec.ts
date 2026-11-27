import { expect, test } from '@playwright/test';

test.describe('Public authentication navigation', () => {
  const publicPages = [
    '/',
    '/properties.html',
    '/about.html',
    '/contact.html',
    '/sell.html',
    '/resources.html',
    '/compare.html',
  ];

  for (const path of publicPages) {
    test(`provides account entry on ${path}`, async ({ page }) => {
      await page.goto(path);
      const entry = page.locator('a[data-account-entry]').first();
      await expect(entry).toBeVisible();

      const href = await entry.getAttribute('href');
      const url = new URL(href!, 'http://127.0.0.1:4173');
      expect(url.pathname).toBe('/sign-in.html');
      expect(url.searchParams.get('returnTo')).toBe(path);
    });
  }

  test('direct reset access does not unlock password update', async ({ page }) => {
    await page.goto('/reset-password.html');
    await expect(page.locator('[data-auth-form]')).toBeHidden();
    await expect(page.locator('[role="status"]')).toContainText(/invalid|expired|account recovery|account services/i);
  });

  test('authentication navigation is meaningful without JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/properties.html');
    const entry = page.locator('a[data-account-entry]').first();
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute('href', /^\/sign-in\.html(?:\?|$)/);
    await context.close();
  });
});
