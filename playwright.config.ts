import { defineConfig } from '@playwright/test';

const defaultBaseUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  // 'github' reporter ispisuje poruku pada kao GitHub annotation (čitljivo i bez skidanja artefakata).
  reporter: process.env.CI ? [['dot'], ['github']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseUrl,
    // Samo snimka zaslona kod pada; trace se namjerno ne sprema jer bi sadržavao lozinku iz zahtjeva za prijavu.
    screenshot: 'only-on-failure',
  },
});
