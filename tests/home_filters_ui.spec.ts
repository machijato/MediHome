import { test, expect, Page, Route } from '@playwright/test';

// Filteri na početnoj stranici (lokacija, cijena, tip rada, specijalizacija, aktivni filteri). Lažirani API.

const OPT_WORK = 'aaaaaaaa-0000-4000-8000-000000000001';
const OPT_SPEC = 'bbbbbbbb-0000-4000-8000-000000000002';

const listing = {
  id: 'l1', slug: 'oglas-1', title: 'Oglas 1', description: 'Opis', price_from: 30, price_unit: 'EUR', city: 'Grad Zagreb',
  category_id: 'cat-1', status: 'approved', created_at: '2026-10-01T10:00:00Z', listing_images: [], listing_rating_stats: null,
};

function fulfillJson(route: Route, data: unknown, headers: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range', ...headers }, body: JSON.stringify(body) });
}

async function mockApi(page: Page, listingUrls: string[], optionMatches: Record<string, string[]> = {}) {
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    switch (table) {
      case 'provider_listings':
        if (url.searchParams.get('select') === 'city') {
          return fulfillJson(route, [{ city: 'Grad Zagreb' }, { city: 'Grad Zagreb' }, { city: 'Bjelovarsko-bilogorska' }]);
        }
        listingUrls.push(decodeURIComponent(url.toString()));
        return fulfillJson(route, [listing], { 'content-range': '0-0/1' });
      case 'listing_selected_options': {
        const optionId = (url.searchParams.get('option_id') ?? '').replace(/^in\.\(|\)$/g, '');
        listingUrls.push(decodeURIComponent(url.toString()));
        return fulfillJson(route, (optionMatches[optionId] ?? ['l1']).map((listing_id) => ({ listing_id })));
      }
      case 'service_categories':
        return fulfillJson(route, [{ id: 'cat-1', slug: 'fizioterapeut' }]);
      case 'service_option_groups':
        return fulfillJson(route, [
          { key: 'work_type', display_order: 3, service_options: [{ id: OPT_WORK, label: 'Dolazak u dom / teren', display_order: 1, is_active: true }] },
          {
            key: 'specialization',
            display_order: 1,
            service_options: [
              { id: OPT_SPEC, label: 'Neurološka fizioterapija', display_order: 1, is_active: true },
              { id: 'cccccccc-0000-4000-8000-000000000003', label: 'Ostalo', display_order: 9, is_active: true },
            ],
          },
        ]);
      default:
        return fulfillJson(route, []);
    }
  });
}

test('location chips show listing counts and drive the query and the URL', async ({ page }) => {
  const urls: string[] = [];
  await mockApi(page, urls);
  await page.goto('/');

  await expect(page.locator('[data-testid="filter-county-Grad Zagreb"]')).toContainText('2');
  await expect(page.locator('[data-testid="filter-county-Bjelovarsko-bilogorska"]')).toContainText('1');

  await page.locator('[data-testid="filter-county-Grad Zagreb"]').click();
  await expect(page).toHaveURL(/county=Grad(\+|%20)Zagreb/);
  await expect.poll(() => urls.some((u) => u.includes('city=ilike.%Grad+Zagreb%'))).toBe(true);
  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveText('Grad Zagreb');
  await expect(page.locator('[data-testid="home-results-count"]')).toContainText('1 od 1');
});

test('price range filters by starting price and shows an active chip', async ({ page }) => {
  const urls: string[] = [];
  await mockApi(page, urls);
  await page.goto('/');

  await page.locator('[data-testid="filters-toggle"]').click();
  await page.locator('[data-testid="filter-price-min"]').fill('20');
  await page.locator('[data-testid="filter-price-max"]').fill('50');
  await page.locator('[data-testid="filter-price-apply"]').click();

  await expect(page).toHaveURL(/min=20/);
  await expect(page).toHaveURL(/max=50/);
  await expect.poll(() => urls.some((u) => u.includes('price_from=gte.20') && u.includes('price_from=lte.50'))).toBe(true);
  await expect(page.locator('[data-testid="active-filter-chip"]')).toContainText('Cijena: 20 – 50 €');
});

test('work type and specialization filters need the physiotherapist category and use inner joins per group', async ({ page }) => {
  const urls: string[] = [];
  await mockApi(page, urls);
  await page.goto('/');

  // Bez kategorije: nema opcija, nego uputa.
  await page.locator('[data-testid="filters-toggle"]').click();
  await expect(page.locator('[data-testid="filters-category-hint"]')).toBeVisible();
  await expect(page.locator('[data-testid="filter-group-tip"]')).toHaveCount(0);

  await page.goto('/?cat=fizioterapeut');
  await page.locator('[data-testid="filters-toggle"]').click();
  await expect(page.locator('[data-testid="filter-group-tip"]')).toBeVisible();
  await expect(page.locator('[data-testid="filter-group-spec"]')).toBeVisible();
  // "Ostalo" se ne nudi kao filter.
  await expect(page.locator('[data-testid="filter-group-spec"]')).not.toContainText('Ostalo');

  await page.locator(`[data-testid="filter-option-tip-${OPT_WORK}"]`).click();
  await page.locator(`[data-testid="filter-option-spec-${OPT_SPEC}"]`).click();
  await expect(page).toHaveURL(new RegExp(`tip=${OPT_WORK}`));
  await expect(page).toHaveURL(new RegExp(`spec=${OPT_SPEC}`));

  // Svaka skupina se razrješava zasebno, pa se glavni upit ograničava na presjek.
  await expect.poll(() => urls.some((u) => u.includes('listing_selected_options') && u.includes(`option_id=in.(${OPT_WORK})`))).toBe(true);
  await expect.poll(() => urls.some((u) => u.includes('listing_selected_options') && u.includes(`option_id=in.(${OPT_SPEC})`))).toBe(true);
  await expect.poll(() => urls.some((u) => u.includes('provider_listings') && u.includes('id=in.(l1)'))).toBe(true);
});

test('groups combine with AND: no listing matches both, so no results are shown', async ({ page }) => {
  const urls: string[] = [];
  await mockApi(page, urls, { [OPT_WORK]: ['l1'], [OPT_SPEC]: ['l2'] });
  await page.goto(`/?cat=fizioterapeut&tip=${OPT_WORK}&spec=${OPT_SPEC}`);

  await expect(page.locator('text=Nema rezultata').first()).toBeVisible();
  await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="show-all-listings"]')).toBeVisible();
});

test('active filter chips can be removed one by one and all at once', async ({ page }) => {
  await mockApi(page, []);
  await page.goto(`/?cat=fizioterapeut&county=Grad%20Zagreb&min=10&q=masaza`);

  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveCount(4);
  await page.locator('[data-testid="active-filter-chip"]', { hasText: 'Pojam: masaza' }).click();
  await expect(page).not.toHaveURL(/q=masaza/);
  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveCount(3);

  await page.locator('[data-testid="filters-clear-all"]').click();
  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveCount(0);
  expect(new URL(page.url()).search).toBe('');
});

test('invalid filter values in the URL are ignored instead of breaking the page', async ({ page }) => {
  const urls: string[] = [];
  await mockApi(page, urls);
  await page.goto('/?cat=fizioterapeut&min=abc&max=-5&tip=not-a-uuid,);drop');

  await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(1);
  expect(urls.every((u) => !u.includes('price_from=gte') && !u.includes('price_from=lte') && !u.includes('listing_selected_options'))).toBe(true);
});
