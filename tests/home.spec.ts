import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/localhost:3000/);

  const root = page.locator('#root');
  await expect(root).toHaveCount(1);
});
