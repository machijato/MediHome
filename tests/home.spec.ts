import { test, expect } from '@playwright/test';

test('authenticated user can create listing on localhost and see success or explicit error state', async ({ page }) => {
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
    console.log('URL:', page.url());
    console.log('TITLE:', await page.title());
    const testIds = await page.locator('[data-testid]').evaluateAll((elements) =>
      elements.map((el) => el.getAttribute('data-testid'))
    );
    console.log('DATA TESTIDS:', testIds);
    console.log('BROWSER LOGS CAPTURED:', browserLogs);
    console.log('PAGE ERRORS CAPTURED:', pageErrors);
    await page.screenshot({ path: `${diagnosticsPrefix}-${label}.png`, fullPage: true });
  };

  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const authUserChip = page.locator('[data-testid="auth-user-chip"]');
    if (!(await authUserChip.isVisible())) {
      await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible();
      await page.locator('[data-testid="open-auth-modal"]').click();
      await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
      await page.locator('[data-testid="auth-email-input"]').fill('makiblaz@gmail.com');
      await page.locator('[data-testid="auth-password-input"]').fill('Maki4321');
      await page.locator('[data-testid="auth-submit-button"]').click();
      await expect(authUserChip).toBeVisible({ timeout: 20000 });
    }

    const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
    const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();
    const opener = (await navbarOpener.isVisible()) ? navbarOpener : ctaOpener;

    await expect(opener).toBeVisible();
    await opener.click();

    const modal = page.locator('[data-testid="create-listing-modal"]');
    await expect(modal).toBeVisible();

    await page.locator('[data-testid="category-physio"]').click();
    await page.locator('[data-testid="next-step"]').click();

    await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
    await page.locator('[data-testid="input-price"]').fill('30');
    await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
    await page.locator('[data-testid="input-description"]').fill('Automated authenticated wizard submit flow check.');

    await page.locator('[data-testid="submit-listing"]').click();
    const errorMessage = page.locator('[data-testid="error-message"]');

    try {
      await expect(modal).not.toBeVisible({ timeout: 20000 });
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });
    } catch {
      await expect(errorMessage).toBeVisible({ timeout: 20000 });
    }
  } catch (error) {
    await captureDiagnostics('failure');
    throw error;
  }
});
