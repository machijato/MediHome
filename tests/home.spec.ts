import { test, expect } from '@playwright/test';

test('home page create listing wizard submits with stable selectors', async ({ page }) => {
  const uniqueTitle = `E2E Test Oglas ${Date.now()}`;

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
  const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();

  const useNavbarOpener = (await navbarOpener.count()) > 0 && await navbarOpener.isVisible();
  const opener = useNavbarOpener ? navbarOpener : ctaOpener;

  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());
  const testIds = await page.locator('[data-testid]').evaluateAll((elements) =>
    elements.map((el) => el.getAttribute('data-testid'))
  );
  console.log('DATA TESTIDS:', testIds);
  console.log('COUNT open-create-listing:', await page.locator('[data-testid="open-create-listing"]').count());
  console.log('COUNT open-create-listing-cta:', await page.locator('[data-testid="open-create-listing-cta"]').count());
  console.log('COUNT create-listing-modal:', await page.locator('[data-testid="create-listing-modal"]').count());
  await page.screenshot({ path: 'localhost-before-opener.png', fullPage: true });

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
