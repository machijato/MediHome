import { test, expect, Page, Route } from '@playwright/test';

// Admin: blokiranje korisnika mora se prikazati samo ako je baza stvarno spremila promjenu. Lažirani API.

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const FAKE_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'admin-1', role: 'authenticated', aud: 'authenticated', exp })}.signature`;

const ADMIN = { id: 'admin-1', email: 'admin@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'Admin' }, created_at: '2026-01-01T00:00:00Z' };

function fulfillJson(route: Route, data: unknown) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function setup(page: Page, opts: { patchSaves: boolean; patches: any[] }) {
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: FAKE_JWT, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'fake', user: ADMIN }),
    }),
  );
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    const method = route.request().method();

    if (table === 'provider_profiles' && method === 'PATCH') {
      opts.patches.push(route.request().postDataJSON());
      // Prava baza vraća redak samo ako je promjena spremljena (inače prazno polje).
      return fulfillJson(route, opts.patchSaves ? [{ id: 'u2' }] : []);
    }
    if (table === 'provider_profiles' && url.searchParams.get('user_id')) {
      return fulfillJson(route, [{ id: 'p-admin', user_id: 'admin-1', is_admin: true }]);
    }
    if (table === 'provider_profiles') {
      return fulfillJson(route, [
        { id: 'p-admin', user_id: 'admin-1', display_name: 'Admin', email: 'admin@example.com', status: 'approved', is_public: true, is_admin: true, created_at: '2026-03-01T00:00:00Z', provider_listings: [{ count: 0 }] },
        { id: 'u2', user_id: 'user-2', display_name: 'Obican Korisnik', email: 'obican@example.com', status: 'active', is_public: true, is_admin: false, created_at: '2026-10-01T00:00:00Z', provider_listings: [{ count: 1 }] },
      ]);
    }
    return fulfillJson(route, []);
  });
  await page.goto('/');
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-email-input"]').fill('admin@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka-za-test');
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
  await page.locator('[data-testid="nav-admin-link"]').click();
  await page.locator('[data-testid="admin-tab-users"]').click();
  await expect(page.locator('[data-testid="admin-user-item"]')).toHaveCount(2);
}

test('banning a user is shown only after the database saved it', async ({ page }) => {
  const patches: any[] = [];
  await setup(page, { patchSaves: true, patches });

  await page.locator('[data-testid="admin-ban-button"]').click();
  await expect(page.locator('[data-testid="admin-unban-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="admin-users-error"]')).toHaveCount(0);
  expect(patches[0]).toMatchObject({ status: 'banned', is_public: false });

  await page.locator('[data-testid="admin-unban-button"]').click();
  await expect(page.locator('[data-testid="admin-ban-button"]')).toBeVisible();
  expect(patches[1]).toMatchObject({ status: 'active', is_public: true });
});

test('when the database does not save the ban, the admin sees an error instead of a false success', async ({ page }) => {
  const patches: any[] = [];
  await setup(page, { patchSaves: false, patches });

  await page.locator('[data-testid="admin-ban-button"]').click();
  await expect(page.locator('[data-testid="admin-users-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="admin-unban-button"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="admin-ban-button"]')).toBeVisible();
});
