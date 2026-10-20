import { test, expect, Page, Route } from '@playwright/test';

// Novoregistrirani korisnik nema redak u provider_profiles. UI testovi s lažiranim API-jem
// provjeravaju da se profil stvara pri spremanju kontakta i pri objavi prvog oglasa.

const USER = {
  id: 'user-1',
  email: 'novi@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Novi Korisnik' },
  created_at: '2026-10-20T00:00:00Z',
};

function fulfillJson(route: Route, data: unknown) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

type Writes = Array<{ table: string; method: string; body: any }>;

async function mockApi(page: Page, writes: Writes) {
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'fake-access', token_type: 'bearer', expires_in: 3600, refresh_token: 'fake-refresh', user: USER }),
    }),
  );
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }));

  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    const method = route.request().method();

    if (method === 'POST' || method === 'PATCH') {
      const body = route.request().postDataJSON();
      writes.push({ table, method, body });
      if (table === 'provider_profiles') return fulfillJson(route, [{ id: 'new-profile', ...body }]);
      if (table === 'provider_listings') return fulfillJson(route, [{ id: 'new-listing' }]);
      return fulfillJson(route, []);
    }

    if (table === 'service_categories') return fulfillJson(route, [{ id: 'cat-1', slug: 'fizioterapeut' }]);
    // Korisnik još nema profil: svaki upit na provider_profiles vraća prazan rezultat.
    return fulfillJson(route, []);
  });
}

async function login(page: Page) {
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-email-input"]').fill('novi@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka-za-test');
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
}

test('new user without a profile can create it by saving contact details, and sees the saved data', async ({ page }) => {
  const writes: Writes = [];
  await mockApi(page, writes);
  await page.goto('/');
  await login(page);
  await page.locator('[data-testid="nav-my-profile-link"]').click();

  await expect(page.locator('[data-testid="profile-missing-note"]')).toBeVisible();
  // Obrazac je odmah otvoren i predpopunjen iz računa.
  await expect(page.locator('[data-testid="input-display-name"]')).toHaveValue('Novi Korisnik');
  await expect(page.locator('[data-testid="input-email"]')).toHaveValue('novi@example.com');

  await page.locator('[data-testid="input-phone"]').fill('0911111111');
  await page.locator('[data-testid="input-city"]').fill('Zagreb');
  await page.locator('[data-testid="save-profile-button"]').click();

  await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  // Podaci se vide nakon spremanja (ranije su ostajali prazni).
  await expect(page.locator('[data-testid="profile-card"]')).toContainText('0911111111');
  await expect(page.locator('[data-testid="profile-card"]')).toContainText('Zagreb');
  await expect(page.locator('[data-testid="profile-missing-note"]')).toHaveCount(0);

  const insert = writes.find((w) => w.table === 'provider_profiles' && w.method === 'POST');
  expect(insert?.body).toMatchObject({ user_id: 'user-1', provider_type: 'individual', phone: '0911111111', city: 'Zagreb' });
  // Zaštićena polja klijent ne šalje.
  expect(insert?.body).not.toHaveProperty('is_admin');
  expect(insert?.body).not.toHaveProperty('status');
});

test('failed profile save shows an error instead of a false success message', async ({ page }) => {
  const writes: Writes = [];
  await mockApi(page, writes);
  // Baza odbije upis (npr. mrežna ili RLS greška).
  await page.route(/\/rest\/v1\/provider_profiles(\?|$)/, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'denied' }) });
    }
    return fulfillJson(route, []);
  });
  await page.goto('/');
  await login(page);
  await page.locator('[data-testid="nav-my-profile-link"]').click();
  await page.locator('[data-testid="save-profile-button"]').click();

  await expect(page.locator('[data-testid="save-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="save-success"]')).toHaveCount(0);
});

test('new user without a profile can publish a first listing; the profile is created automatically', async ({ page }) => {
  const writes: Writes = [];
  await mockApi(page, writes);
  await page.goto('/');
  await login(page);

  await page.locator('[data-testid="open-create-listing"]').first().click();
  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();
  await page.locator('[data-testid="input-title"]').fill('Prvi oglas novog korisnika');
  await page.locator('[data-testid="input-price"]').fill('40');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Opis oglasa.');
  await page.locator('[data-testid="next-step"]').click();
  await page.locator('[data-testid="skip-image-upload"]').click();

  await expect(page.locator('[data-testid="listing-submit-success"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="error-message"]')).toHaveCount(0);

  const profileInsert = writes.find((w) => w.table === 'provider_profiles' && w.method === 'POST');
  expect(profileInsert?.body).toMatchObject({ user_id: 'user-1', display_name: 'Novi Korisnik', email: 'novi@example.com' });
  const listingInsert = writes.find((w) => w.table === 'provider_listings' && w.method === 'POST');
  expect(listingInsert?.body).toMatchObject({ title: 'Prvi oglas novog korisnika', provider_profile_id: 'new-profile' });
});
