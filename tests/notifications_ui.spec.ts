import { test, expect, Page, Route } from '@playwright/test';

// UI testovi zvonca s obavijestima bez stvarnog Supabasea: zahtjevi prema REST/Auth API-ju su lažirani.

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function fulfillJson(route: Route, data: unknown, headers: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
}

async function mockApi(page: Page, opts: { admin?: boolean } = {}) {
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh',
        user: { id: 'user-1', email: 'tester@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'Test Korisnik' }, created_at: '2026-01-01T00:00:00Z' },
      }),
    }),
  );

  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    const isHead = route.request().method() === 'HEAD';

    switch (table) {
      case 'provider_profiles':
        return fulfillJson(route, [{ id: 'p-me', is_admin: Boolean(opts.admin) }]);
      case 'listing_reviews':
        if (url.searchParams.get('provider_profile_id')) {
          return fulfillJson(route, [
            { id: 'r1', reviewer_name: 'Ana H.', rating: 4, created_at: daysAgo(1), provider_listings: { title: 'Moj oglas', slug: 'moj-oglas' } },
          ]);
        }
        if (url.searchParams.get('reviewer_user_id')) {
          return fulfillJson(route, [{ id: 'my-rev', provider_listings: { title: 'Tuđi oglas', slug: 'tudji-oglas' } }]);
        }
        return fulfillJson(route, []);
      case 'review_replies':
        return fulfillJson(route, [{ review_id: 'my-rev', created_at: daysAgo(2) }]);
      case 'provider_listings':
        if (isHead) return route.fulfill({ status: 200, headers: { 'content-range': '*/2', 'access-control-expose-headers': 'content-range' }, body: '' });
        return fulfillJson(route, [{ id: 'l1', slug: 'novi-oglas', title: 'Novi fizioterapeut', city: 'Split', created_at: daysAgo(3) }], { 'content-range': '0-0/1' });
      case 'review_reports':
        return route.fulfill({ status: 200, headers: { 'content-range': '*/1', 'access-control-expose-headers': 'content-range' }, body: isHead ? '' : '[]' });
      default:
        return fulfillJson(route, []);
    }
  });
}

async function login(page: Page) {
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-email-input"]').fill('tester@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka-za-test');
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
}

test('logged-out visitors do not see the notification bell', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="notification-bell"]')).toHaveCount(0);
});

test('bell shows unseen count, lists reviews, replies and new listings, and clears the badge once opened', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await login(page);

  // Nova recenzija na moj oglas + odgovor na moju recenziju + novi oglas = 3 nove obavijesti.
  await expect(page.locator('[data-testid="notification-badge"]')).toHaveText('3');

  await page.locator('[data-testid="notification-bell"]').click();
  await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible();
  const items = page.locator('[data-testid="notification-item"]');
  await expect(items).toHaveCount(3);
  await expect(page.locator('[data-testid="notification-panel"]')).toContainText('Ana H. je ocijenio/la vaš oglas ocjenom 4,0');
  await expect(page.locator('[data-testid="notification-panel"]')).toContainText('Pružatelj je odgovorio na vašu recenziju');
  await expect(page.locator('[data-testid="notification-panel"]')).toContainText('Novi oglas: Novi fizioterapeut');
  // Nove stavke su istaknute dok je panel otvoren.
  await expect(items.first()).toHaveAttribute('data-fresh', 'true');
  // Značka nestaje nakon pregleda.
  await expect(page.locator('[data-testid="notification-badge"]')).toHaveCount(0);

  // Poveznica vodi na najnovije oglase.
  await page.locator('[data-testid="notification-all-new"]').click();
  await expect(page).toHaveURL(/sort=najnovije/);
  await expect(page.locator('[data-testid="notification-panel"]')).toHaveCount(0);
});

test('admin sees what is waiting for review in the bell', async ({ page }) => {
  await mockApi(page, { admin: true });
  await page.goto('/');
  await login(page);

  await page.locator('[data-testid="notification-bell"]').click();
  const adminBox = page.locator('[data-testid="notification-admin"]');
  await expect(adminBox).toContainText('Oglasa čeka odobrenje: 2');
  await expect(adminBox).toContainText('Otvorenih prijava recenzija: 1');
});
