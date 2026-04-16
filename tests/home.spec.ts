import { test, expect } from '@playwright/test';

test('home page create listing wizard submits with stable selectors', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/vercel\.app/);

  const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
  const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();

  const useNavbarOpener = (await navbarOpener.count()) > 0 && await navbarOpener.isVisible();
  const opener = useNavbarOpener ? navbarOpener : ctaOpener;

  await expect(opener).toBeVisible();
  await opener.click();

  const modal = page.locator('[data-testid="create-listing-modal"]');
  await expect(modal).toBeVisible();

  await page.locator('[data-testid="category-physio"]').click();
  await page.locator('[data-testid="next-step"]').click();

  await page.locator('[data-testid="input-title"]').fill('Playwright Fizioterapeut');
  await page.locator('[data-testid="input-price"]').fill('30');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Automated full wizard submit flow check.');

  await page.locator('[data-testid="submit-listing"]').click();

  await Promise.race([
    expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 15000 }),
    expect(modal).not.toBeVisible({ timeout: 15000 }),
  ]);
});
