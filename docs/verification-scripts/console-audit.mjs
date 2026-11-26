import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const paths = ['/', '/?preview=demo', '/properties.html', '/properties.html?preview=demo', '/properties.html?preview=demo&view=map', '/property/demo-kabulonga-family-house?preview=demo', '/property/example-listing', '/compare.html?preview=demo&properties=demo-kabulonga-family-house,demo-foxdale-apartment', '/about.html', '/sell.html', '/contact.html', '/resources.html', '/account.html', '/admin.html'];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
try {
  for (const path of paths) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const messages = [], errors = [], failedRequests = [];
    page.on('console', message => { if (['warning', 'error'].includes(message.type())) messages.push({ type: message.type(), text: message.text() }); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if(response.status() >= 400) messages.push({type:'http-error',text:`${response.status()} ${response.url()}`}); });
    page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    await page.goto(`${process.env.AUDIT_BASE || 'http://127.0.0.1:4174'}${path}`);
    await page.waitForLoadState('networkidle');
    results.push({ path, messages, errors, failedRequests });
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync('docs/screenshots/reconstruction/console.json', JSON.stringify(results, null, 2));
const failures = results.filter(row => row.messages.length || row.errors.length || row.failedRequests.length);
console.log(JSON.stringify({ pages: results.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
