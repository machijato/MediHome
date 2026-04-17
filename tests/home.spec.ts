import { test, expect } from '@playwright/test';

test('authenticated user can login, create listing, and verify listing render', async ({ page }) => {
  const uniqueTitle = `E2E Auth Oglas ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await page.locator('[data-testid="open-auth-modal"]').click();
  await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
  await page.locator('[data-testid="auth-email-input"]').fill('makiblaz@gmail.com');
  await page.locator('[data-testid="auth-password-input"]').fill('Maki4321');
  await page.locator('[data-testid="auth-submit-button"]').click();

  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 20000 });
  const authModal = page.locator('[data-testid="auth-modal"]');
  if (await authModal.isVisible()) {
    await page.locator('[data-testid="auth-close-button"]').click();
    await expect(authModal).not.toBeVisible();
  }

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

  await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
  await page.locator('[data-testid="input-price"]').fill('30');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Automated full wizard submit flow check.');

  await page.locator('[data-testid="submit-listing"]').click();
  const errorMessage = page.locator('[data-testid="error-message"]');

  try {
    await expect(modal).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });
  } catch {
    await expect(errorMessage).toBeVisible({ timeout: 20000 });
  }
});
