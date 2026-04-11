import { test, expect } from '@playwright/test';

test('home page body is visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
});
