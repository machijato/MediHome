import { defineConfig } from '@playwright/test';

const defaultBaseUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseUrl,
  },
});
