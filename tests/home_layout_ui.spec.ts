import { test, expect, Page, Route } from '@playwright/test';

// Izgled naslovnice: reklamna traka odvojena od oglasa, naslov "Oglasi" i skrolanje pri filtriranju. Lažirani API.

const listing = (n: number) => ({
  id: `l${n}`, slug: `oglas-${n}`, title: `Oglas ${n}`, description: 'Opis', price_from: 30, price_unit: 'EUR', city: 'Grad Zagreb',
  category_id: 'cat-1', status: 'approved', created_at: '2026-10-01T10:00:00Z', listing_images: [], listing_rating_stats: null,
});

const AD_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="728" height="90"><rect width="728" height="90" fill="#ccc"/></svg>')}`;

function fulfillJson(route: Route, data: unknown, headers: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range', ...headers }, body: JSON.stringify(body) });
}

async function mockApi(page: Page, withAd: boolean) {
  const many = Array.from({ length: 12 }, (_, i) => listing(i + 1));
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    switch (table) {
      case 'provider_listings':
        if (url.searchParams.get('select') === 'city') return fulfillJson(route, [{ city: 'Grad Zagreb' }, { city: 'Grad Zagreb' }]);
        return fulfillJson(route, many, { 'content-range': '0-11/12' });
      case 'service_categories':
        return fulfillJson(route, [{ id: 'cat-1', slug: 'fizioterapeut' }]);
      case 'ad_slots':
        return fulfillJson(route, withAd ? [{ id: 's1', supports_rotation: false }] : []);
      case 'ad_campaigns':
        return fulfillJson(route, withAd ? [{ id: 'c1', rotation_interval_seconds: 5 }] : []);
      case 'ad_creatives':
        return fulfillJson(route, withAd ? [{ id: 'k1', image_url: AD_IMAGE, target_url: 'https://example.org', alt_text: 'Reklama', weight: 1 }] : []);
      default:
        return fulfillJson(route, []);
    }
  });
}

test('ad band is separated from the listings and the listings start with an "Oglasi" heading', async ({ page }) => {
  await mockApi(page, true);
  await page.goto('/');

  const ad = page.locator('[data-testid="ad-slot-homepage-top"]');
  const heading = page.locator('[data-testid="listings-heading"]');
  await expect(ad).toBeVisible();
  await expect(heading).toHaveText('Oglasi');
  await expect(page.locator('[data-testid="listing-card"]').first()).toBeVisible();

  const adBox = (await ad.boundingBox())!;
  const headingBox = (await heading.boundingBox())!;
  const firstCardBox = (await page.locator('[data-testid="listing-card"]').first().boundingBox())!;
  // Naslov je ispod reklame s jasnim razmakom, a oglasi tek ispod naslova.
  expect(headingBox.y).toBeGreaterThanOrEqual(adBox.y + adBox.height + 40);
  expect(firstCardBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
});

test('without an active campaign no empty ad band is shown', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/');
  await expect(page.locator('[data-testid="listings-heading"]')).toHaveText('Oglasi');
  await expect(page.locator('[data-testid="ad-slot-homepage-top"]')).toHaveCount(0);
});

test('changing a filter or category keeps the scroll position instead of jumping to the top', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/');
  await expect(page.locator('[data-testid="listing-card"]').first()).toBeVisible();

  await page.locator('[data-testid="category-filter-fizioterapeut"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(300);

  await page.locator('[data-testid="category-filter-fizioterapeut"]').click();
  await expect(page).toHaveURL(/cat=fizioterapeut/);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 150);

  await page.locator('[data-testid="filter-county-Grad Zagreb"]').click();
  await expect(page).toHaveURL(/county=/);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
});

test('footer category link scrolls to the listings, other footer links open the new page at the top', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/');
  await expect(page.locator('[data-testid="listing-card"]').first()).toBeVisible();

  await page.locator('[data-testid="footer-category-fizioterapeut"]').click();
  await expect(page).toHaveURL(/cat=fizioterapeut/);
  await expect.poll(async () => Math.abs((await page.locator('#rezultati').boundingBox())!.y)).toBeLessThan(150);

  await page.locator('[data-testid="footer-terms-link"]').click();
  await expect(page).toHaveURL(/uvjeti-koristenja/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
