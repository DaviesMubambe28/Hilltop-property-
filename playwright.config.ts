
import { defineConfig, devices } from '@playwright/test';
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
  testDir: './e2e',

  outputDir: './work/reconstruction/public-results',

  workers: 1,

  webServer: {
    command:
      'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',

    url: 'http://127.0.0.1:4173',

    reuseExistingServer: false,

    timeout: 120000,

    env: {
      VITE_SUPABASE_URL: 'not-configured',
      VITE_SUPABASE_ANON_KEY: 'not-configured',
      VITE_SITE_URL: 'http://127.0.0.1:4173',
      VITE_GA_MEASUREMENT_ID: '',
      VITE_WHATSAPP_NUMBER: '',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4173',

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
          width: 320,
          height: 900,
        },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
