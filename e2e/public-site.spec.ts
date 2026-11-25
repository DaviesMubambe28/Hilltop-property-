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

test('about and comparison journeys provide clear recovery paths', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page.getByRole('heading', { name: 'Your comfort is our priority.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore properties' })).toHaveAttribute('href', '/properties.html');

  await page.goto('/compare.html');
  await expect(page.getByRole('heading', { name: 'Connect the property catalogue.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse properties' })).toHaveAttribute('href', '/properties.html');
});

test('major public pages have no horizontal overflow or broken internal destinations', async ({ page, request }) => {
  const paths = ['/', '/properties.html', '/sell.html', '/about.html', '/contact.html', '/compare.html', '/property/example-listing'];
  const destinations = new Set<string>();
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} should not overflow horizontally`).toBeLessThanOrEqual(1);
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    hrefs.filter((href) => href.startsWith('/') && !href.startsWith('//')).forEach((href) => destinations.add(href.split('#')[0]));
  }
  for (const destination of destinations) {
    const response = await request.get(destination);
    expect(response.status(), `${destination} should resolve`).toBeLessThan(400);
  }
});

test('customer and staff portals fail safely without deployment credentials', async ({ page }) => {
  await page.goto('/account.html');
  await expect(page.getByRole('heading', { name: 'Account services are not connected.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);

  await page.goto('/admin.html');
  await expect(page.getByRole('heading', { name: 'Connect the staff workspace.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
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

test('development property preview provides an accessible gallery and conversion actions', async ({ page }, testInfo) => {
  await page.goto('/property/demo-kabulonga-family-house?preview=demo');
  await expect(page.getByRole('note')).toContainText('not public inventory');
  await expect(page.getByRole('heading', { name: '[DEMO] Kabulonga family house' })).toBeVisible();

  await page.getByRole('button', { name: 'Open image 1 of 2' }).click();
  const lightbox = page.getByRole('dialog', { name: 'Property image gallery' });
  await expect(lightbox).toBeVisible();
  await expect(page.locator('#gallery-lightbox-caption')).toContainText('Image 1 of 2');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#gallery-lightbox-caption')).toContainText('Image 2 of 2');
  await page.getByRole('button', { name: 'Close image gallery' }).click();
  await expect(lightbox).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open image 1 of 2' })).toBeFocused();

  if (testInfo.project.name === 'mobile') {
    await expect(page.getByRole('button', { name: 'Request viewing' }).last()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Call' })).toHaveAttribute('href', /^tel:/);
  }
});

test('comparison page fails safely without deployment credentials', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/compare.html?properties=one,two');
  await expect(page.getByRole('heading', { name: 'Connect the property catalogue.' })).toBeVisible();
  expect(errors).toEqual([]);
});
