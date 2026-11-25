import { expect, test } from '@playwright/test';

test('homepage is honest and search is discoverable in the first mobile viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('98%');
  await expect(page.locator('body')).not.toContainText('Patricia Mwansa');
  await expect(page.locator('.location-grid')).not.toContainText(/\d+ properties/);
  await expect(page.locator('#property-map-panel')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.locator('#search-query').boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(844);
});

test('catalogue starts as vertical cards without automatically opening a map', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/properties.html?preview=demo');
  await expect(page.locator('.property-card')).toHaveCount(3);
  await expect(page.locator('#property-map-panel')).toBeHidden();
  const cards = await page.locator('.property-card').evaluateAll(items => items.map(item => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })));
  expect(cards[1].x).toBe(cards[0].x);
  expect(cards[1].y).toBeGreaterThan(cards[0].y);
});

test('mobile catalogue filters are a keyboard dismissible dialog and restore focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/properties.html?preview=demo');
  const trigger = page.getByRole('button', { name: /Advanced search/ });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Filter properties' })).toBeVisible();
  await page.getByLabel('Minimum price (K)', { exact: true }).fill('2000000');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('.property-card')).toHaveCount(1);
  await expect(page).toHaveURL(/minPrice=2000000/);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('comparison retains two readable properties in a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/compare.html?preview=demo&properties=demo-kabulonga-family-house,demo-foxdale-apartment');
  const table = page.locator('.comparison-table');
  await expect(table.locator('thead th')).toHaveCount(3);
  expect(await table.evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(320);
});

test('preview enquiries and viewings fail honestly without uncaught errors or false delivery', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/property/demo-kabulonga-family-house?preview=demo');
  await page.getByRole('button', { name: 'Enquire', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Test Customer');
  await page.getByLabel('Email', { exact: true }).fill('customer@example.invalid');
  await page.getByLabel('I consent to being contacted.').check();
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.locator('#property-action [role="status"]')).toContainText('not sent');
  await expect(page.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
  await page.getByRole('button', { name: 'Request viewing', exact: true }).first().click();
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});
