import { test, expect } from '@playwright/test';

test('articles page loads', async ({ page }) => {
  test.setTimeout(15000);

  await page.goto('/clanci');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="articles-page"]')).toBeVisible({ timeout: 10000 });
  // Stranica se renderira bez crasha — čak i ako nema članaka
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 10000 });
});

test('article detail page shows not found for invalid slug', async ({ page }) => {
  test.setTimeout(15000);

  await page.goto('/clanak/nepostojeci-clanak-slug-12345');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="article-not-found"]')).toBeVisible({ timeout: 10000 });
});

test('articles link exists in navbar', async ({ page }) => {
  test.setTimeout(15000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="nav-articles-link"]')).toBeVisible({ timeout: 10000 });
  await page.locator('[data-testid="nav-articles-link"]').click();
  await expect(page).toHaveURL('/clanci');
  await expect(page.locator('[data-testid="articles-page"]')).toBeVisible({ timeout: 10000 });
});
