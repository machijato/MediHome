import { test, expect } from '@playwright/test';

test('home page loads on Vercel preview', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);
  await expect(page.locator('html')).toHaveCount(1);

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});
