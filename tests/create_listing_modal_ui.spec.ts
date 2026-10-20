import { test, expect, Page, Route } from '@playwright/test';

// Prozor "Objavi oglas" mora se pri svakom otvaranju vratiti na prvi korak s praznim obrascem,
// a uređivanje postojećeg oglasa mora i dalje početi od koraka 2 s podacima oglasa. Lažirani API.

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

async function mockApi(page: Page) {
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
      return fulfillJson(route, [{ id: 'p-me', user_id: 'user-1', display_name: 'Test Korisnik', is_admin: false }]);
    }
    if (table === 'provider_listings' && url.searchParams.get('provider_profile_id')) {
      return fulfillJson(route, [
        { id: 'l1', slug: 'moj-oglas', title: 'Moj postojeći oglas', description: 'Opis postojećeg oglasa', status: 'approved', city: 'Zagreb', price_from: 25, price_unit: 'EUR', created_at: '2026-10-01T00:00:00Z', category_id: 'cat-1', service_categories: { slug: 'fizioterapeut' } },
      ]);
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

test('create listing modal starts from step 1 with an empty form every time it is opened', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');

  const opener = page.locator('[data-testid="open-create-listing"]').first();
  const modal = page.locator('[data-testid="create-listing-modal"]');

  // Prvo otvaranje: odabir kategorije, pa unos naslova na koraku 3.
  await opener.click();
  await expect(page.locator('[data-testid="category-selection"]')).toBeVisible();
  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();
  await page.locator('[data-testid="input-title"]').fill('Napola unesen oglas');
  await page.locator('[data-testid="input-price"]').fill('99');

  // Zatvaranje gumbom "Odustani", pa ponovno otvaranje: opet početak.
  await modal.getByRole('button', { name: 'Odustani' }).click();
  await expect(modal).toHaveCount(0);
  await opener.click();
  await expect(page.locator('[data-testid="category-selection"]')).toBeVisible();
  await expect(page.locator('[data-testid="input-title"]')).toHaveCount(0);

  // Obrazac je prazan i kad se ponovno dođe do koraka 3.
  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();
  await expect(page.locator('[data-testid="input-title"]')).toHaveValue('');
  await expect(page.locator('[data-testid="input-price"]')).toHaveValue('');

  // Zatvaranje križićem također vraća na početak.
  await page.locator('[data-testid="create-listing-modal"] button:has(svg.lucide-x)').first().click();
  await expect(modal).toHaveCount(0);
  await opener.click();
  await expect(page.locator('[data-testid="category-selection"]')).toBeVisible();
});

test('editing an existing listing still opens on step 2 with the listing data, and a new listing afterwards starts fresh', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await login(page);
  await page.locator('[data-testid="nav-my-profile-link"]').click();

  await page.locator('[data-testid="edit-listing-button"]').first().click();
  await expect(page.locator('[data-testid="category-selection"]')).toHaveCount(0);
  await page.locator('[data-testid="next-step"]').click();
  await expect(page.locator('[data-testid="input-title"]')).toHaveValue('Moj postojeći oglas');
  await expect(page.locator('[data-testid="input-price"]')).toHaveValue('25');

  await page.locator('[data-testid="create-listing-modal"]').getByRole('button', { name: 'Odustani' }).click();

  // Novi oglas nakon uređivanja: početak, bez podataka starog oglasa.
  await page.locator('[data-testid="open-create-listing"]').first().click();
  await expect(page.locator('[data-testid="category-selection"]')).toBeVisible();
  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();
  await expect(page.locator('[data-testid="input-title"]')).toHaveValue('');
});
