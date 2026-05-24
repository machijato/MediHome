import { test, expect } from '@playwright/test';

test('listing detail page has provider link that opens profile page', async ({ page }) => {
  test.setTimeout(30000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const firstCard = page.locator('[data-testid="listing-card"] a, a[href*="/oglas/"]').first();
  const count = await firstCard.count();
  if (count === 0) {
    test.skip();
    return;
  }

  await firstCard.click();
  await expect(page).toHaveURL(/\/oglas\//);
  await expect(page.locator('[data-testid="listing-detail-page"]')).toBeVisible({ timeout: 10000 });

  const providerLink = page.locator('[data-testid="listing-detail-provider-link"]');
  await expect(providerLink).toBeVisible({ timeout: 5000 });

  await providerLink.click();
  await expect(page).toHaveURL(/\/profil\//);
  await expect(page.locator('[data-testid="provider-profile-page"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="provider-profile-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="provider-profile-listings"]')).toBeVisible();
});
