// Available entry states only. Authenticated role screens require authorised staging.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
try {
  for (const path of ['/account.html', '/admin.html', '/property/example-listing']) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.env.AUDIT_BASE || 'http://127.0.0.1:4174'}${path}`);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      records.push({ path, width, state: 'unconfigured', errors, violations: result.violations });
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync('docs/screenshots/reconstruction/portal-accessibility.json', JSON.stringify(records, null, 2));
const blocking = records.flatMap(record => record.violations.filter(item => item.impact === 'critical' || item.impact === 'serious'));
console.log(JSON.stringify({ checks: records.length, blockingViolations: blocking.length, pageErrors: records.flatMap(record => record.errors) }));
process.exitCode = blocking.length || records.some(record => record.errors.length) ? 1 : 0;
