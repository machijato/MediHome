import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://medi-home-git-codex-add-playwright-s-2d7227-machijatos-projects.vercel.app/',
  },
});
