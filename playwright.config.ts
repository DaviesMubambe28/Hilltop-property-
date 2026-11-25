import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } },
  projects: [
    { name: 'mobile', use: { viewport: { width: 320, height: 900 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
