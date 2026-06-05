import 'dotenv/config';
import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const chip = page.locator('[data-testid="auth-user-chip"]');
  if (await chip.isVisible()) return;
  await page.locator('[data-testid="open-auth-modal"]').click();
  await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
  await page.locator('[data-testid="auth-email-input"]').fill(
    process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com'
  );
  await page.locator('[data-testid="auth-password-input"]').fill(
    process.env.E2E_AUTH_PASSWORD ?? 'Maki4321'
  );
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(chip).toBeVisible({ timeout: 20000 });
}

test('authenticated user can view and edit their profile', async ({ page }) => {
  test.setTimeout(60000);

  await login(page);

  await page.goto('/moj-profil');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="my-profile-page"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="my-listings-section"]')).toBeVisible();

  await page.locator('[data-testid="edit-profile-button"]').click();
  await expect(page.locator('[data-testid="input-display-name"]')).toBeVisible();

  await page.locator('[data-testid="input-display-name"]').fill('Test Korisnik E2E');

  await page.locator('[data-testid="save-profile-button"]').click();
  await expect(page.locator('[data-testid="save-success"]')).toBeVisible({ timeout: 10000 });
});

test('unauthenticated user is redirected from /moj-profil', async ({ page }) => {
  test.setTimeout(15000);

  await page.goto('/moj-profil');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL('/');
});

test('my profile link is visible in navbar when logged in', async ({ page }) => {
  test.setTimeout(30000);

  await login(page);

  await expect(page.locator('[data-testid="nav-my-profile-link"]')).toBeVisible({ timeout: 10000 });
  await page.locator('[data-testid="nav-my-profile-link"]').click();
  await expect(page).toHaveURL('/moj-profil');
  await expect(page.locator('[data-testid="my-profile-page"]')).toBeVisible({ timeout: 10000 });
});
