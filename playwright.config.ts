import { defineConfig } from '@playwright/test';

const defaultBaseUrl = 'https://medi-home-chi.vercel.app/';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseUrl,
  },
});
