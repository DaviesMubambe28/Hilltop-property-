import { expect, test } from '@playwright/test';

test.describe('Mocked authentication journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://hilltop-test.invalid/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'synthetic-access-token',
            refresh_token: 'synthetic-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: '10000000-0000-4000-8000-000000000001', email: 'customer@example.invalid' },
          }),
        });
        return;
      }
      if (url.includes('/auth/v1/recover')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
      if (url.includes('/auth/v1/logout')) {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      if (url.includes('/auth/v1/user')) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'no session' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('direct reset access stays locked', async ({ page }) => {
    let updateRequests = 0;
    await page.route('https://hilltop-test.invalid/**', async (route) => {
      if (route.request().url().includes('/auth/v1/user')) updateRequests++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/reset-password.html');
    await expect(page.locator('[data-auth-form]')).toBeHidden();
    await expect(page.locator('[role="status"]')).toContainText(/invalid|expired|recovery/i);
    expect(updateRequests).toBe(0);
  });

  test('sign-in preserves a same-origin return URL', async ({ page }) => {
    await page.goto('/sign-in.html?returnTo=%2Fproperties.html%3Flisting%3Drent');
    await page.getByLabel('Email address').fill('customer@example.invalid');
    await page.getByLabel('Password').fill('Synthetic123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/properties\.html\?listing=rent/);
  });

  test('unsafe sign-in return URL falls back to account', async ({ page }) => {
    await page.goto('/sign-in.html?returnTo=https%3A%2F%2Fmalicious.example');
    await page.getByLabel('Email address').fill('customer@example.invalid');
    await page.getByLabel('Password').fill('Synthetic123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/account\.html/);
  });

  test('opening sign-out does not terminate a session', async ({ page }) => {
    let logoutRequests = 0;
    await page.route('https://hilltop-test.invalid/**', async (route) => {
      if (route.request().url().includes('/auth/v1/logout')) logoutRequests++;
      await route.fulfill({ status: 204, body: '' });
    });
    await page.goto('/sign-out.html');
    expect(logoutRequests).toBe(0);
    await expect(page.getByRole('heading', { name: 'Sign out?' })).toBeVisible();
  });
});
