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

test('calculator rejects a deposit greater than the property price', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mortgage calculator' }).click();
  await page.locator('#property-price').fill('100000');
  await page.locator('#deposit').fill('100001');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#calculator-result')).toContainText('Deposit must be less than the property price');
});

test('does not claim that unavailable property alerts can be created', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Property alerts are being prepared.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create property alert' })).toHaveCount(0);
});

test('advanced search state is shareable and restored by browser navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rent' }).click();
  await page.getByRole('button', { name: /Advanced search/ }).click();
  await page.getByLabel('Keywords').fill('family home');
  await page.getByLabel('Minimum price (K)').fill('2500');
  await page.getByLabel('Minimum bedrooms').fill('3');
  await page.getByLabel('Solar').check();
  await page.getByRole('button', { name: /Find properties/ }).click();
  await expect(page).toHaveURL(/listing=rent/);
  await expect(page).toHaveURL(/q=family\+home/);
  await expect(page).toHaveURL(/amenities=solar/);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).not.toHaveURL(/q=family/);
  await page.goBack();
  await expect(page.getByLabel('Keywords')).toHaveValue('family home');
  await expect(page.getByLabel('Minimum bedrooms')).toHaveValue('3');
  await expect(page.getByLabel('Solar')).toBeChecked();
});
