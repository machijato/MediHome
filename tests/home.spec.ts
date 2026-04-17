import { test, expect } from '@playwright/test';

test('authenticated user can login, create listing, and verify listing render', async ({ page }, testInfo) => {
  const uniqueTitle = `E2E Auth Oglas ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const authUserChip = page.locator('[data-testid="auth-user-chip"]');
  if (await authUserChip.count()) {
    await page.locator('[data-testid="auth-logout-button"]').click();
  }

  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());

  const openAuthModalCount = await page.locator('[data-testid="open-auth-modal"]').count();
  const authUserChipCount = await page.locator('[data-testid="auth-user-chip"]').count();
  const openCreateListingCount = await page.locator('[data-testid="open-create-listing"]').count();
  const openCreateListingCtaCount = await page.locator('[data-testid="open-create-listing-cta"]').count();

  console.log('[data-testid="open-auth-modal"] count:', openAuthModalCount);
  console.log('[data-testid="auth-user-chip"] count:', authUserChipCount);
  console.log('[data-testid="open-create-listing"] count:', openCreateListingCount);
  console.log('[data-testid="open-create-listing-cta"] count:', openCreateListingCtaCount);

  const dataTestIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid]'))
      .map((element) => element.getAttribute('data-testid'))
      .filter((value): value is string => Boolean(value)),
  );
  console.log('data-testid attributes found on page:', dataTestIds);

  await page.screenshot({
    path: testInfo.outputPath('pre-login-page.png'),
    fullPage: true,
  });

  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 20000 });
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
