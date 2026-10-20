import { test, expect, Page, Route } from '@playwright/test';

// Blokirani korisnik umjesto obrasca za oglas i recenziju vidi poruku s kontaktom administratora.
// Stvarnu zabranu provodi baza (okidači); ovdje se provjerava prikaz. Lažirani API, bez stvarnog Supabasea.

const LISTING_ID = '11111111-1111-1111-1111-111111111111';
const USER = {
  id: 'user-1',
  email: 'korisnik@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Test Korisnik' },
  created_at: '2026-10-20T00:00:00Z',
};

const listingRow = {
  id: LISTING_ID,
  slug: 'test-oglas',
  title: 'Testni oglas',
  description: 'Opis',
  price_from: 30,
  price_unit: 'EUR',
  city: 'Zagreb',
  provider_profile_id: 'p-other',
  category_id: 'cat-1',
  status: 'approved',
  created_at: '2026-10-01T10:00:00Z',
  listing_images: [],
};

function fulfillJson(route: Route, data: unknown) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockApi(page: Page, status: 'active' | 'banned') {
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'fake', token_type: 'bearer', expires_in: 3600, refresh_token: 'fake', user: USER }),
    }),
  );
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    if (table === 'provider_profiles' && url.searchParams.get('user_id')) {
      return fulfillJson(route, [{ id: 'p-me', user_id: 'user-1', display_name: 'Test Korisnik', is_admin: false, status }]);
    }
    if (table === 'provider_listings') return fulfillJson(route, url.searchParams.get('slug') ? [listingRow] : []);
    if (table === 'service_categories') return fulfillJson(route, url.searchParams.get('id') ? [{ name: 'Fizioterapeut', slug: 'fizioterapeut' }] : [{ id: 'cat-1', slug: 'fizioterapeut' }]);
    if (table === 'provider_profiles') return fulfillJson(route, [{ id: 'p-other', display_name: 'Pružatelj', provider_type: 'physio', city: 'Zagreb' }]);
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

test('blocked user sees a notice with the admin contact instead of the create-listing form', async ({ page }) => {
  await mockApi(page, 'banned');
  await page.goto('/');
  await login(page);

  await page.locator('[data-testid="open-create-listing"]').first().click();
  await expect(page.locator('[data-testid="create-listing-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="banned-notice"]')).toContainText('blokiran');
  await expect(page.locator('[data-testid="banned-contact-link"]')).toHaveAttribute('href', /^mailto:makiblaz@gmail\.com\?subject=/);
  await expect(page.locator('[data-testid="category-selection"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="next-step"]')).toHaveCount(0);
});

test('blocked user sees the notice instead of the review button on a listing page', async ({ page }) => {
  await mockApi(page, 'banned');
  await page.goto('/oglas/test-oglas');
  await login(page);

  await expect(page.locator('[data-testid="banned-notice"]')).toBeVisible();
  await expect(page.locator('[data-testid="reviews-open-form"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="review-form"]')).toHaveCount(0);
});

test('active user is not affected: create-listing form and review button are available', async ({ page }) => {
  await mockApi(page, 'active');
  await page.goto('/oglas/test-oglas');
  await login(page);
  await expect(page.locator('[data-testid="reviews-open-form"]')).toBeVisible();
  await expect(page.locator('[data-testid="banned-notice"]')).toHaveCount(0);

  // Sesija ostaje nakon navigacije, pa nova prijava nije potrebna.
  await page.goto('/');
  await page.locator('[data-testid="open-create-listing"]').first().click();
  await expect(page.locator('[data-testid="category-selection"]')).toBeVisible();
  await expect(page.locator('[data-testid="banned-notice"]')).toHaveCount(0);
});
