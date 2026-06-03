import { test, expect } from '@playwright/test';

test('homepage renders without crash regardless of ad slot data', async ({ page }) => {
  test.setTimeout(15000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Stranica mora renderirati normalno
  await expect(
    page.locator('[data-testid="open-auth-modal"]')
  ).toBeVisible({ timeout: 10000 });

  // AdSlot postoji ili ne — oboje je ispravno ponašanje
  const adSlot = page.locator('[data-testid="ad-slot-homepage-top"]');
  const slotVisible = await adSlot.isVisible().catch(() => false);

  if (slotVisible) {
    // Ako postoji aktivan kreativ, mora imati link s href i target="_blank"
    const link = adSlot.locator('a').first();
    await expect(link).toHaveAttribute('href');
    await expect(link).toHaveAttribute('target', '_blank');
    console.log('AdSlot je vidljiv i ima ispravan link.');
  } else {
    console.log('AdSlot nije vidljiv (nema aktivnih kampanja) — ispravno ponašanje.');
  }
});
