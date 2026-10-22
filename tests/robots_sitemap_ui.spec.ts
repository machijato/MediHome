import { test, expect } from '@playwright/test';

// robots.txt i sitemap.xml za tražilice (statične datoteke, ne treba baza).

test('robots.txt hides private pages and points to the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('User-agent: *');
  for (const path of ['/admin', '/moj-profil', '/reset-password']) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toMatch(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);
});

test('sitemap.xml lists public pages only', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of ['/', '/o-nama', '/clanci', '/kategorija/fizioterapeut', '/uvjeti-koristenja', '/politika-privatnosti']) {
    expect(locs).toContain(path);
  }
  for (const path of ['/admin', '/moj-profil', '/reset-password']) {
    expect(locs).not.toContain(path);
  }
  expect(new Set(locs).size).toBe(locs.length);
});

test('every sitemap page opens in the app', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range' }, body: '[]' }),
  );
  const body = await (await page.request.get('/sitemap.xml')).text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of locs) {
    await page.goto(path);
    await expect(page.locator('nav').first()).toBeVisible();
    await expect(page.locator('[data-testid="footer-copyright"]')).toBeVisible();
  }
});
