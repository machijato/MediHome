import { test, expect, Page, Route } from '@playwright/test';

// Prijava mora preživjeti osvježavanje stranice, a odjava mora stvarno odjaviti. Lažirani API.

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const FAKE_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'user-1', role: 'authenticated', aud: 'authenticated', exp })}.signature`;

const USER = {
  id: 'user-1',
  email: 'korisnik@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Test Korisnik' },
  created_at: '2026-10-20T00:00:00Z',
};

function fulfillJson(route: Route, data: unknown) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockApi(page: Page, opts: { admin?: boolean } = {}) {
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: FAKE_JWT, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'fake-refresh', user: USER }),
    }),
  );
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }));
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/rest/v1/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/provider_profiles') && url.searchParams.get('user_id')) {
      return fulfillJson(route, [{ id: 'p-me', user_id: 'user-1', display_name: 'Test Korisnik', is_admin: Boolean(opts.admin) }]);
    }
    return fulfillJson(route, []);
  });
}

async function login(page: Page) {
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-email-input"]').fill('korisnik@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka-za-test');
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
}

test('user stays logged in after a page refresh', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await login(page);

  await page.reload();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-testid="open-auth-modal"]')).toHaveCount(0);
});

test('refreshing "Moj profil" keeps the user on that page instead of redirecting home', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await login(page);
  await page.locator('[data-testid="nav-my-profile-link"]').click();
  await expect(page.locator('[data-testid="my-profile-page"]')).toBeVisible({ timeout: 15000 });

  await page.reload();
  await expect(page.locator('[data-testid="my-profile-page"]')).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/moj-profil$/);
});

test('refreshing the admin panel keeps an admin on that page instead of redirecting home', async ({ page }) => {
  await mockApi(page, { admin: true });
  await page.goto('/');
  await login(page);
  await page.locator('[data-testid="nav-admin-link"]').click();
  await expect(page.locator('[data-testid="admin-page"]')).toBeVisible({ timeout: 15000 });

  await page.reload();
  await expect(page.locator('[data-testid="admin-page"]')).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/admin$/);
});

test('a logged-out visitor opening "Moj profil" or the admin panel is sent to the home page', async ({ page }) => {
  await mockApi(page);
  await page.goto('/moj-profil');
  await expect(page).toHaveURL(/127\.0\.0\.1:3000\/$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/127\.0\.0\.1:3000\/$/);
});

test('logging out really logs the user out, also after a refresh', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await login(page);

  await page.getByRole('button', { name: 'Odjava' }).click();
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-testid="auth-user-chip"]')).toHaveCount(0);
});
