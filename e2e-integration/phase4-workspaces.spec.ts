import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const screenshotRoot = join(process.cwd(), 'docs', 'screenshots', 'phase4');
const userId = '10000000-0000-4000-8000-000000000004';
const agentId = '20000000-0000-4000-8000-000000000004';

const property = {
  id: '30000000-0000-4000-8000-000000000004',
  reference: 'HTP-2404',
  title: 'Contemporary Kabulonga residence',
  slug: 'contemporary-kabulonga-residence',
  listing_type: 'sale',
  status: 'draft',
  review_status: 'submitted',
  review_feedback: null,
  price: 4850000,
  currency: 'ZMW',
  is_available: false,
  updated_at: '2026-11-27T08:00:00.000Z',
  agent: { name: 'Mwamba Chanda' },
  creator: { full_name: 'Mwamba Chanda' },
};

function rowsFor(url: string) {
  if (url.includes('/rest/v1/property_types')) return [{ id: 'type-1', name: 'House' }];
  if (url.includes('/rest/v1/locations')) return [{ id: 'location-1', name: 'Kabulonga', province: 'Lusaka' }];
  if (url.includes('/rest/v1/amenities')) return [{ id: 'amenity-1', name: 'Swimming pool' }, { id: 'amenity-2', name: 'Backup power' }];
  if (url.includes('/rest/v1/branches')) return [{ id: 'branch-1', name: 'Lusaka', city: 'Lusaka', province: 'Lusaka', is_active: true }];
  if (url.includes('/rest/v1/agents')) return [{ id: agentId, profile_id: userId, name: 'Mwamba Chanda', title: 'Residential Property Consultant', email: 'agent@example.invalid', phone: '+260 000 000 000', is_published: true, branch: { name: 'Lusaka' }, profile: { is_active: true } }];
  if (url.includes('/rest/v1/properties')) return [property];
  if (url.includes('/rest/v1/enquiries')) return [{ id: 'enquiry-1', name: 'Synthetic Customer', email: 'customer@example.invalid', type: 'property', status: 'new', created_at: '2026-11-27T07:00:00.000Z' }];
  if (url.includes('/rest/v1/pages')) return [{ id: 'page-1', title: 'Buying guide', slug: 'buying-guide', is_published: true, updated_at: '2026-11-27T07:00:00.000Z' }];
  if (url.includes('/rest/v1/articles')) return [{ id: 'article-1', title: 'Market update', slug: 'market-update', status: 'published', updated_at: '2026-11-27T07:00:00.000Z' }];
  if (url.includes('/rest/v1/property_images')) return [];
  return [];
}

async function installBackend(page: Page, role: 'admin' | 'agent' | 'editor') {
  await page.addInitScript(({ id, email }) => {
    localStorage.setItem('sb-hilltop-test-auth-token', JSON.stringify({
      access_token: 'synthetic-access-token',
      refresh_token: 'synthetic-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id, email },
    }));
  }, { id: userId, email: `${role}@example.invalid` });
  await page.route('https://hilltop-test.invalid/**', async route => {
    const request = route.request();
    const url = request.url();
    if (url.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: userId, email: `${role}@example.invalid` }) });
      return;
    }
    if (url.includes('/rest/v1/profiles')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: userId, full_name: `${role[0].toUpperCase()}${role.slice(1)} User`, phone: null, role, is_active: true }) });
      return;
    }
    if (request.method() === 'HEAD') {
      await route.fulfill({ status: 200, headers: { 'content-range': '0-3/4' }, body: '' });
      return;
    }
    const rows = rowsFor(url);
    const wantsSingle = request.headers().accept?.includes('application/vnd.pgrst.object+json');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wantsSingle ? (rows[0] ?? {}) : rows) });
  });
}

async function shot(page: Page, project: string, name: string) {
  const directory = join(screenshotRoot, project);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
}

test('captures the redesigned public, sign-out, and rotating hero experiences', async ({ page }, testInfo) => {
  await installBackend(page, 'admin');
  await page.goto('/about.html');
  await expect(page.getByRole('heading', { name: 'Your comfort is our priority.' })).toBeVisible();
  await shot(page, testInfo.project.name, 'about');

  await page.goto('/sign-out.html');
  await expect(page.getByRole('heading', { name: 'Sign out?' })).toBeVisible();
  await shot(page, testInfo.project.name, 'sign-out-confirmation');

  await page.goto('/');
  const activeSlide = page.locator('.hero-slide.is-active');
  await expect(activeSlide).toHaveCount(1);
  const initialIndex = await activeSlide.getAttribute('data-slide');
  await page.waitForTimeout(6500);
  await expect(page.locator('.hero-slide.is-active')).not.toHaveAttribute('data-slide', initialIndex ?? '0');
  await shot(page, testInfo.project.name, 'homepage-rotating-hero');
});

test('captures administrator dashboard, upload, agents, and approval queue', async ({ page }, testInfo) => {
  await installBackend(page, 'admin');
  await page.goto('/admin.html');
  await expect(page.getByRole('heading', { name: 'Operational overview.' })).toBeVisible();
  await expect(page.locator('#dashboard-stats')).toContainText('Properties');
  await shot(page, testInfo.project.name, 'admin-dashboard');

  await page.locator('[data-view="properties"]').click();
  await page.getByRole('button', { name: 'Add property' }).click();
  await expect(page.locator('#property-form')).toBeVisible();
  await shot(page, testInfo.project.name, 'admin-property-upload');

  await page.locator('[data-view="agents"]').click();
  await expect(page.getByRole('heading', { name: 'Agent management' })).toBeVisible();
  await expect(page.locator('#agent-list')).toContainText('Mwamba Chanda');
  await shot(page, testInfo.project.name, 'admin-agent-management');

  await page.locator('[data-view="approvals"]').click();
  await expect(page.getByRole('heading', { name: 'Property approval queue' })).toBeVisible();
  await expect(page.locator('#approval-list')).toContainText('HTP-2404');
  await shot(page, testInfo.project.name, 'admin-approval-queue');
});

test('captures the scoped agent workspace and property uploader', async ({ page }, testInfo) => {
  await installBackend(page, 'agent');
  await page.goto('/agent.html');
  await expect(page.getByRole('heading', { name: 'Your property desk.' })).toBeVisible();
  await shot(page, testInfo.project.name, 'agent-dashboard');
  await page.locator('[data-workspace-view="property-form"]').click();
  await expect(page.getByRole('heading', { name: 'Add property' })).toBeVisible();
  await shot(page, testInfo.project.name, 'agent-property-upload');
});

test('captures the scoped editor dashboard', async ({ page }, testInfo) => {
  await installBackend(page, 'editor');
  await page.goto('/editor.html');
  await expect(page.getByRole('heading', { name: 'Content and listing quality.' })).toBeVisible();
  await expect(page.locator('#workspace-stats')).toContainText('Awaiting review');
  await shot(page, testInfo.project.name, 'editor-dashboard');
});
