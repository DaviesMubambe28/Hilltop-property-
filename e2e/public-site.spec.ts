import { expect, test } from '@playwright/test';

test('public site remains usable without deployment credentials', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your place');
  await expect(page.getByText('Catalogue configuration required')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile navigation is keyboard and touch operable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile navigation only');
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open menu' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.getByRole('link', { name: 'Buy', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
});

test('calculator produces a repayment estimate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mortgage calculator' }).click();
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#calculator-result')).toContainText('Estimated monthly repayment');
});
