import { test, expect } from '@playwright/test';

test('authenticated user can create listing on localhost and see created listing in UI', async ({ page }) => {
  test.setTimeout(60000);
  const uniqueTitle = `E2E Auth Oglas ${Date.now()}`;
  const diagnosticsPrefix = `auth-flow-${Date.now()}`;
  const browserLogs: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    const log = `[${msg.type()}] ${msg.text()}`;
    browserLogs.push(log);
    console.log('BROWSER LOG:', log);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  const captureDiagnostics = async (label: string) => {
    console.log('DIAGNOSTIC LABEL:', label);
    try {
      console.log('URL:', page.url());
    } catch (error) {
      console.log('DIAGNOSTICS URL unavailable:', error);
    }
    try {
      console.log('TITLE:', await page.title());
    } catch (error) {
      console.log('DIAGNOSTICS TITLE unavailable (likely page/context/browser closed):', error);
    }
    try {
      const testIds = await page.locator('[data-testid]').evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-testid'))
      );
      console.log('DATA TESTIDS:', testIds);
    } catch (error) {
      console.log('DIAGNOSTICS DATA TESTIDS unavailable (likely page/context/browser closed):', error);
    }
    console.log('BROWSER LOGS CAPTURED:', browserLogs);
    console.log('PAGE ERRORS CAPTURED:', pageErrors);
    try {
      await page.screenshot({ path: `${diagnosticsPrefix}-${label}.png`, fullPage: true });
    } catch (error) {
      console.log('DIAGNOSTICS SCREENSHOT unavailable (likely page/context/browser closed):', error);
    }
  };

  try {
    console.log('E2E STEP: before page.goto');
    await page.goto('/');
    console.log('E2E STEP: after page.goto');
    await page.waitForLoadState('domcontentloaded');

    const authUserChip = page.locator('[data-testid="auth-user-chip"]');
    if (!(await authUserChip.isVisible())) {
      console.log('E2E STEP: before opening auth modal');
      await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible();
      await page.locator('[data-testid="open-auth-modal"]').click();
      await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
      console.log('E2E STEP: after auth modal visible');
      console.log('E2E STEP: before filling email/password');
      await page.locator('[data-testid="auth-email-input"]').fill('makiblaz@gmail.com');
      await page.locator('[data-testid="auth-password-input"]').fill('Maki4321');
      console.log('E2E STEP: before clicking auth submit');
      await page.locator('[data-testid="auth-submit-button"]').click();
      console.log('E2E STEP: after clicking auth submit');
      console.log('E2E STEP: before waiting for auth-user-chip');
      await expect(
        authUserChip,
        'Timed out waiting for authenticated user chip after login submit.'
      ).toBeVisible({ timeout: 20000 });
      console.log('E2E STEP: after auth-user-chip visible');
    }

    const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
    const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();
    const opener = (await navbarOpener.isVisible()) ? navbarOpener : ctaOpener;

    console.log('E2E STEP: before opening create-listing modal');
    await expect(opener).toBeVisible();
    await opener.click();

    const modal = page.locator('[data-testid="create-listing-modal"]');
    await expect(modal).toBeVisible();
    console.log('E2E STEP: after create-listing-modal visible');

    console.log('E2E STEP: before category selection');
    await page.locator('[data-testid="category-physio"]').click();
    console.log('E2E STEP: before next-step');
    await page.locator('[data-testid="next-step"]').click();

    console.log('E2E STEP: before filling final form');
    await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
    await page.locator('[data-testid="input-price"]').fill('30');
    await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
    await page.locator('[data-testid="input-description"]').fill('Automated authenticated wizard submit flow check.');

    console.log('E2E STEP: before submit-listing');
    await page.locator('[data-testid="submit-listing"]').click();
    console.log('E2E STEP: after submit-listing');
    const errorMessage = page.locator('[data-testid="error-message"]');

    console.log('E2E STEP: before strict success assertion');
    const submitOutcome = await Promise.race([
      modal.waitFor({ state: 'hidden', timeout: 20000 }).then(() => 'modal-closed' as const),
      errorMessage.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error-visible' as const),
    ]);

    if (submitOutcome === 'error-visible') {
      const visibleError = (await errorMessage.first().innerText()).trim();
      throw new Error(`Create listing failed with visible UI error-message: ${visibleError}`);
    }

    await expect(
      page.getByText(uniqueTitle),
      `Timed out waiting for new listing title "${uniqueTitle}" to appear in UI after modal close.`
    ).toBeVisible({ timeout: 20000 });

    if (await errorMessage.first().isVisible()) {
      const visibleError = (await errorMessage.first().innerText()).trim();
      throw new Error(`Create listing showed error-message after success markers: ${visibleError}`);
    }
  } catch (error) {
    await captureDiagnostics('failure');
    throw error;
  }
});
