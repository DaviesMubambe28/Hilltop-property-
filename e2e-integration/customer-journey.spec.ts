import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { demoProperty } from '../src/demo-property';

// Explicit mocked service evidence: never represents real delivery or live inventory.
for (const failure of [false, true]) {
  test(`customer journey with ${failure ? 'failed' : 'successful'} mocked persistence`, async ({ page }) => {
    const errors: string[] = [];
    const submissions: Array<{ type: string; payload: Record<string, unknown> }> = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://hilltop-test.invalid/**', async route => {
      const url = route.request().url();
      let body: unknown = [];
      let status = 200;
      if (url.includes('search_property_ids')) body = [{ property_id: demoProperty.id, total_count: 1 }];
      else if (url.includes('/properties?')) body = url.includes('slug=eq.') ? demoProperty : [demoProperty];
      else if (url.includes('submit-enquiry') || url.includes('submit-viewing')) {
        const type = url.includes('submit-viewing') ? 'viewing' : 'enquiry';
        submissions.push({ type, payload: route.request().postDataJSON() });
        status = failure ? 503 : 200;
        body = failure ? { error: { message: 'synthetic service failure' } } : { id: '70000000-0000-4000-8000-000000000001', status: 'pending' };
      } else if (url.includes('track-property-view')) body = { ok: true };
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.route('https://www.openstreetmap.org/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Mock map</p>' }));
    await page.goto('/');
    await page.getByLabel('Keywords', { exact: true }).fill('Kabulonga');
    await page.getByRole('button', { name: /Find properties/ }).click();
    await expect(page).toHaveURL(/q=Kabulonga/);
    await page.getByRole('link', { name: 'View all properties' }).click();
    await expect(page).toHaveURL(/properties.html.*q=Kabulonga/);
    await expect(page.getByRole('heading', { name: '[DEMO] Kabulonga family house', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'View property', exact: false }).first().click();
    await page.getByRole('button', { name: /Open image 1 of 2/ }).click();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#gallery-lightbox-caption')).toContainText('Image 2 of 2');
    await page.keyboard.press('Escape');
    const whatsapp = page.getByRole('link', { name: 'WhatsApp', exact: true });
    await expect(whatsapp).toHaveAttribute('href', /DEMO-SALE-001/);
    await page.getByRole('button', { name: 'Enquire', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill('Synthetic Customer');
    await page.getByLabel('Email', { exact: true }).fill('synthetic@example.invalid');
    await page.getByLabel('I consent to being contacted.').check();
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.locator('#property-action [role="status"]')).toContainText(failure ? 'not sent' : 'Enquiry received');
    await page.getByRole('button', { name: 'Request viewing', exact: true }).first().click();
    await page.getByLabel('Name', { exact: true }).fill('Synthetic Customer');
    await page.getByLabel('Email', { exact: true }).fill('synthetic@example.invalid');
    await page.getByLabel('Preferred date and time').fill('2027-12-01T10:00');
    await page.getByLabel('I consent to being contacted.').check();
    await page.locator('#detail-viewing button').click();
    await expect(page.locator('#property-action [role="status"]')).toContainText(failure ? 'not sent' : 'is pending');
    expect(submissions.map(item => item.type)).toEqual(['enquiry', 'viewing']);
    expect(submissions.every(item => item.payload.propertyId === demoProperty.id && item.payload.consent === true)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('missing photos, empty, loading and backend errors have honest recovery states', async ({ page }, testInfo) => {
  mkdirSync('docs/screenshots/reconstruction/states',{recursive:true});
  const capture = (name:string) => page.screenshot({path:`docs/screenshots/reconstruction/states/${name}-${testInfo.project.name}.png`,fullPage:true});
  let state: 'populated' | 'empty' | 'error' = 'populated';
  let releaseFirst!: () => void;
  const firstResponse = new Promise<void>(resolve => { releaseFirst=resolve; });
  let first = true;
  await page.route('https://hilltop-test.invalid/**', async route => {
    const url = route.request().url();
    if(url.includes('search_property_ids')) {
      if(first) { first=false; await firstResponse; }
      await route.fulfill({ status: state === 'error' ? 503 : 200, contentType: 'application/json', body: JSON.stringify(state === 'error' ? {message:'private diagnostic: internal_table'} : state === 'empty' ? [] : [{property_id:demoProperty.id,total_count:1}]) });
    } else await route.fulfill({ contentType:'application/json', body:JSON.stringify(url.includes('/properties?') ? [{...demoProperty,images:[]}] : []) });
  });
  await page.goto('/properties.html');
  await expect(page.locator('.property-grid')).toHaveAttribute('aria-busy','true');
  await capture('loading');
  await expect(page.locator('.property-grid')).toHaveAttribute('aria-busy','true');
  releaseFirst();
  await expect(page.locator('.property-card')).toHaveCount(1);
  await expect(page.locator('.missing-photo')).toContainText('Not yet available');
  await capture('missing-photo');
  expect(await page.locator('.no-image').evaluate(el=>getComputedStyle(el).backgroundImage)).toBe('none');
  state='empty';
  await page.getByRole('button',{name:'Find properties',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No matching properties'})).toBeVisible();
  await capture('empty');
  state='error';
  await page.getByRole('button',{name:'Find properties',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Properties are temporarily unavailable'})).toBeVisible();
  await capture('error');
  await expect(page.locator('body')).not.toContainText('internal_table');
  state='populated';
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.locator('.property-card')).toHaveCount(1);
});

test('tile failures preserve catalogue browsing and explain recovery', async ({ page }) => {
  await page.route('https://hilltop-test.invalid/**', route => route.fulfill({ contentType:'application/json',body:JSON.stringify(route.request().url().includes('search_property_ids') ? [{property_id:demoProperty.id,total_count:1}] : route.request().url().includes('/properties?') ? [demoProperty] : []) }));
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.goto('/properties.html?view=map');
  await expect(page.locator('.map-note')).toContainText('Map imagery is temporarily unavailable');
  await expect(page.locator('.property-card')).toHaveCount(1);
  await page.getByRole('button',{name:'List',exact:true}).click();
  await expect(page.locator('#property-map-panel')).toBeHidden();
});
