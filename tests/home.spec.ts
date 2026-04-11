import { test, expect } from '@playwright/test';

test('home page loads on Vercel preview', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  const root = page.locator('#root');
  await expect(root).toHaveCount(1);
});
