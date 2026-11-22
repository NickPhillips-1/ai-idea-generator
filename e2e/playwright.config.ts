import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  workers: 1,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200',
    trace: process.env.PLAYWRIGHT_TRACE === 'on' ? 'on' : 'retain-on-failure',
    screenshot: process.env.PLAYWRIGHT_SCREENSHOT === 'on' ? 'on' : 'only-on-failure',
  },
});
