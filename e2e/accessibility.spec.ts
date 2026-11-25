import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicPages = [
  '/',
  '/properties.html',
  '/property/demo-kabulonga-family-house?preview=demo',
  '/compare.html',
  '/sell.html',
  '/about.html',
  '/contact.html',
];

for (const path of publicPages) {
  test(`${path} has no automatically detectable critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blockingViolations = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');

    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });
}
