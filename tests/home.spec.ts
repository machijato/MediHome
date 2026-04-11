import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});
