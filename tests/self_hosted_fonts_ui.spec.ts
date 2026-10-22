import { test, expect } from '@playwright/test';

// Fontovi se poslužuju s vlastitog poslužitelja: nijedan zahtjev ne ide prema Googleu. Lažirani API.

test('fonts load from our own server, not from Google', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range' }, body: '[]' }),
  );

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(fontFamily).toContain('Plus Jakarta Sans Variable');

  // Hrvatska slova (č, ć, š, ž, đ) dolaze iz "latin-ext" podskupa i moraju se dati učitati lokalno.
  const loaded = await page.evaluate(async () => {
    await document.fonts.load('16px "Plus Jakarta Sans Variable"', 'čćšžđ');
    return Array.from(document.fonts).some((f) => f.family.includes('Plus Jakarta Sans Variable') && f.status === 'loaded');
  });
  expect(loaded).toBe(true);

  const fontRequests = requests.filter((u) => /\.woff2?(\?|$)/.test(u));
  expect(fontRequests.length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin;
  expect(fontRequests.every((u) => u.startsWith(origin))).toBe(true);
  expect(requests.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
});
