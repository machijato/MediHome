import { test, expect } from '@playwright/test';

test('home page loads on Vercel preview', async ({ page }) => {
  const response = await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  expect(response).not.toBeNull();
  expect(response?.ok()).toBeTruthy();

  await expect(page).toHaveURL(/vercel\.app/);
});
