
import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const configuredExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();

const linuxChromiumPath = '/usr/bin/chromium';

if (configuredExecutable && !existsSync(configuredExecutable)) {
  throw new Error(
    'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH does not point to an existing file.'
  );
}

const chromiumExecutable =
  configuredExecutable ||
  (
    process.platform === 'linux' &&
    existsSync(linuxChromiumPath)
      ? linuxChromiumPath
      : undefined
  );

export default defineConfig({
  testDir: './e2e-integration',

  outputDir: './work/reconstruction/integration-results',

  workers: 1,

  webServer: {
    command:
      'npm run dev -- --host 127.0.0.1 --port 4176 --strictPort',

    url: 'http://127.0.0.1:4176',

    reuseExistingServer: false,

    timeout: 120000,

    env: {
      VITE_SUPABASE_URL: 'https://hilltop-test.invalid',
      VITE_SUPABASE_ANON_KEY: 'synthetic-public-test-key-only',
      VITE_SITE_URL: 'http://127.0.0.1:4176',
      VITE_WHATSAPP_NUMBER: '260000000002',
      VITE_GA_MEASUREMENT_ID: '',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4176',

    trace: 'retain-on-failure',

    launchOptions: {
      ...(chromiumExecutable
        ? { executablePath: chromiumExecutable }
        : {}),

      ...(process.platform === 'linux' &&
      chromiumExecutable
        ? { args: ['--no-sandbox'] }
        : {}),
    },
  },

  projects: [
    {
      name: 'mobile',
      use: {
        viewport: {
          width: 390,
          height: 844,
        },
      },
    },
    {
      name: 'desktop',
      use: {
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },
  ],
});
