import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const useDevServer = process.env.PLAYWRIGHT_USE_DEV_SERVER === '1';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'output/playwright/report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: useDevServer
      ? `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`
      : `pnpm build && pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: useDevServer ? 120 * 1000 : 300 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
