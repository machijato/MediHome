import 'dotenv/config';
import { test, expect } from '@playwright/test';

async function isSupabaseReachable(): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) return false;
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function loginAsAdmin(page: any) {
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

test('admin link is visible in navbar for admin user', async ({ page }) => {
  const reachable = await isSupabaseReachable();
  if (!reachable) {
    console.log('Supabase not reachable in CI — skipping auth test');
    test.skip();
    return;
  }

  test.setTimeout(30000);
  await loginAsAdmin(page);
  await expect(page.locator('[data-testid="nav-admin-link"]')).toBeVisible({ timeout: 10000 });
});

test('admin page loads with dashboard tab', async ({ page }) => {
  const reachable = await isSupabaseReachable();
  if (!reachable) {
    console.log('Supabase not reachable in CI — skipping auth test');
    test.skip();
    return;
  }

  test.setTimeout(30000);
  await loginAsAdmin(page);
  await page.locator('[data-testid="nav-admin-link"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="admin-page"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="stat-total-listings"]')).toBeVisible();
});

test('admin can switch to listings tab', async ({ page }) => {
  const reachable = await isSupabaseReachable();
  if (!reachable) {
    console.log('Supabase not reachable in CI — skipping auth test');
    test.skip();
    return;
  }

  test.setTimeout(30000);
  await loginAsAdmin(page);
  await page.locator('[data-testid="nav-admin-link"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="admin-page"]')).toBeVisible({ timeout: 10000 });
  await page.locator('[data-testid="admin-tab-listings"]').click();
  await expect(page.locator('[data-testid="admin-listings"]')).toBeVisible({ timeout: 5000 });
});

test('non-admin is redirected from /admin', async ({ page }) => {
  test.setTimeout(15000);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL('/');
});
