import { expect, test } from '@playwright/test';

test('dedicated public journeys load and expose working forms', async ({ page }) => {
  await page.goto('/properties.html?listing=rent');
  await expect(page.getByRole('heading', { name: 'Available properties.' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Rent' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/sell.html');
  await expect(page.getByRole('heading', { name: 'Tell us about your property.' })).toBeVisible();
  await expect(page.locator('form[data-public-enquiry="valuation"]')).toBeVisible();

  await page.goto('/contact.html');
  await expect(page.getByRole('heading', { name: 'How can we help?' })).toBeVisible();
  await expect(page.locator('form[data-public-enquiry="general"]')).toBeVisible();
});

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
  await expect(page.locator('#calculator-result')).toContainText('Monthly repayment');
});

test('financial tools use distinct inputs and calculations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rental yield calculator' }).click();
  await page.getByLabel('Purchase price (K)').fill('1200000');
  await page.getByLabel('Monthly rental income (K)').fill('12000');
  await page.getByLabel('Annual expenses (K)').fill('24000');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#calculator-result')).toContainText('Gross yield: 12.00%');
  await expect(page.locator('#calculator-result')).toContainText('Net yield: 10.00%');
});

test('calculator rejects a deposit greater than the property price', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mortgage calculator' }).click();
  await page.locator('#property-price').fill('100000');
  await page.locator('#deposit').fill('100001');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#calculator-result')).toContainText('Deposit must be less than the property price');
});

test('property alerts only report success after persistence', async ({ page }) => {
  await page.goto('/');
  const saveSearch=page.getByRole('button',{name:'Save search & enable alerts'});
  await expect(saveSearch).toBeVisible();
  page.once('dialog',(dialog)=>dialog.accept('Lusaka homes'));
  await saveSearch.click();
  await expect(page.locator('.toast')).toContainText('Supabase is not configured');
  await expect(page.locator('.toast')).not.toContainText('Search saved');
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

test('friendly property URLs load the dedicated property page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/property/example-listing');
  await expect(page.getByRole('heading', { name: 'Property service unavailable' })).toBeVisible();
  await expect(page).toHaveURL(/\/property\/example-listing/);
  expect(errors).toEqual([]);
});

test('comparison page fails safely without deployment credentials', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/compare.html?properties=one,two');
  await expect(page.getByText('Comparison requires a configured Supabase project.')).toBeVisible();
  expect(errors).toEqual([]);
});
