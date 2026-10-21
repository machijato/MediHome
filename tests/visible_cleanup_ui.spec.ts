import { test, expect, Route } from '@playwright/test';

// Vidljivo čišćenje: jezik stranice, podnožje bez izmišljenih podataka, bez slika s picsum.photos. Lažirani API.

function fulfillJson(route: Route, data: unknown, headers: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
}

test('page language is Croatian, footer has no invented data, and no picsum image is requested', async ({ page }) => {
  const picsumRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('picsum.photos')) picsumRequests.push(req.url());
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    if (table === 'provider_listings') {
      return fulfillJson(
        route,
        [{ id: 'l1', slug: 'bez-slike', title: 'Oglas bez slike', description: 'Opis', price_from: 20, price_unit: 'EUR', city: 'Zagreb', category_id: 'cat-1', status: 'approved', created_at: '2026-10-01T10:00:00Z', listing_images: [] }],
        { 'content-range': '0-0/1' },
      );
    }
    if (table === 'service_categories') return fulfillJson(route, [{ id: 'cat-1', slug: 'fizioterapeut' }]);
    return fulfillJson(route, []);
  });

  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  await expect(page.locator('[data-testid="footer-copyright"]')).toContainText(String(new Date().getFullYear()));
  await expect(page.locator('footer')).not.toContainText('234 5678');
  await expect(page.locator('[data-testid="footer-contact-email"]')).toHaveAttribute('href', /^mailto:.+@.+/);
  await expect(page.locator('footer a[href="#"]')).toHaveCount(0);

  const card = page.locator('[data-testid="listing-card"]').first();
  await expect(card).toBeVisible();
  await expect(card.locator('img')).toHaveAttribute('src', '/images/placeholder-listing.svg');
  expect(picsumRequests).toEqual([]);
});
