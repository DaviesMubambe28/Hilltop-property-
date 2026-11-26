import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-integration', outputDir: './work/reconstruction/integration-results', workers: 1,
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://hilltop-test.invalid', VITE_SUPABASE_ANON_KEY: 'synthetic-public-test-key-only', VITE_WHATSAPP_NUMBER: '260000000002' },
  },
  use: { baseURL: 'http://127.0.0.1:4176', launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } },
  projects: [{ name: 'mobile', use: { viewport: { width: 390, height: 844 } } }, { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } }],
});
