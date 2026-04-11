import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const root = page.locator('#root');
  await expect(root).toBeAttached();

  const text = await root.textContent();
  expect((text ?? '').trim().length).toBeGreaterThan(0);
});
