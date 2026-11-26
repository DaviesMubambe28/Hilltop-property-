// Run with a local dev server. Captures are real open UI states, using explicit preview fixtures.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.AUDIT_BASE || 'http://127.0.0.1:4174';
const folder = 'docs/screenshots/reconstruction/dialogs';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
async function audit(page, state, width) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  results.push({ state, width, overflow, violations: result.violations });
  await page.screenshot({ path: `${folder}/${state}-${width}.png` });
}
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const page = await context.newPage();
    await page.goto(base);
    for (const tool of ['mortgage', 'affordability', 'rental', 'cost']) {
      await page.locator(`[data-tool="${tool}"]`).click();
      await page.locator('#tool-dialog').waitFor({ state: 'visible' });
      await audit(page, `calculator-${tool}`, width);
      await page.keyboard.press('Escape');
    }
    await page.goto(`${base}/property/demo-kabulonga-family-house?preview=demo`);
    await page.getByRole('button', { name: /Open image 1 of 2/ }).click();
    await audit(page, 'lightbox', width);
    await page.keyboard.press('Escape');
    if (width === 390) {
      await page.goto(`${base}/properties.html?preview=demo`);
      await page.locator('.property-card').first().waitFor();
      await page.getByRole('button', { name: /Advanced search/ }).click();
      await page.getByRole('dialog', { name: 'Filter properties' }).waitFor();
      await audit(page, 'filters', width);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(`${folder}/accessibility.json`, JSON.stringify(results, null, 2));
const blocking = results.flatMap(row => row.violations.filter(item => item.impact === 'serious' || item.impact === 'critical'));
console.log(JSON.stringify({ checks: results.length, blockingViolations: blocking, overflowingStates: results.filter(row => row.overflow > 1) }, null, 2));
process.exitCode = blocking.length || results.some(row => row.overflow > 1) ? 1 : 0;
