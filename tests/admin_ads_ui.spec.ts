import { test, expect, Page, Route } from '@playwright/test';

// Admin sučelje za reklame: popis, dodavanje s provjerom unosa, pauziranje, brisanje uz potvrdu. Lažirani API.

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const FAKE_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'admin-1', role: 'authenticated', aud: 'authenticated', exp })}.signature`;
const ADMIN = { id: 'admin-1', email: 'admin@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'Admin' }, created_at: '2026-01-01T00:00:00Z' };

type Write = { method: string; table: string; body: any; query: string };

function fulfillJson(route: Route, data: unknown) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

const campaign = {
  id: 'c1', slot_id: 's1', campaign_name: 'Jesenska kampanja', advertiser_name: 'Oglašivač d.o.o.', advertiser_contact: null,
  status: 'active', is_active: true, start_at: '2026-01-01T00:00:00Z', end_at: '2099-01-01T00:00:00Z',
  ad_creatives: [{ id: 'cr1', image_url: 'https://example.com/baner.png', target_url: 'https://example.com', alt_text: 'Baner' }],
};

async function setup(page: Page, writes: Write[], campaigns: unknown[] = [campaign], deleteSucceeds = true) {
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

    if (method !== 'GET' && method !== 'HEAD') {
      let body: any = null;
      try { body = route.request().postDataJSON(); } catch { body = null; }
      writes.push({ method, table, body, query: url.search });
      if (table === 'ad_campaigns' && method === 'POST') return fulfillJson(route, [{ id: 'new-campaign' }]);
      if (method === 'DELETE' && table === 'ad_campaigns') return fulfillJson(route, deleteSucceeds ? [{ id: 'c1' }] : []);
      if (method === 'PATCH') return fulfillJson(route, [{ id: 'c1' }]);
      return fulfillJson(route, []);
    }
    if (table === 'provider_profiles' && url.searchParams.get('user_id')) return fulfillJson(route, [{ id: 'p-admin', user_id: 'admin-1', is_admin: true }]);
    if (table === 'ad_slots') return fulfillJson(route, [{ id: 's1', key: 'homepage-top', name: 'Početna, vrh', width_px: 728, height_px: 90 }]);
    if (table === 'ad_campaigns') return fulfillJson(route, campaigns);
    return fulfillJson(route, []);
  });
  await page.goto('/');
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-email-input"]').fill('admin@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka-za-test');
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.locator('[data-testid="auth-user-chip"]')).toBeVisible({ timeout: 15000 });
  await page.locator('[data-testid="nav-admin-link"]').click();
  await page.locator('[data-testid="admin-tab-ads"]').click();
}

test('admin sees campaigns with status and can pause one', async ({ page }) => {
  const writes: Write[] = [];
  await setup(page, writes);

  await expect(page.locator('[data-testid="admin-ad-campaign"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="admin-ad-state"]')).toHaveText('Aktivna');
  await page.locator('[data-testid="admin-ad-toggle"]').click();
  await expect.poll(() => writes.some((w) => w.method === 'PATCH' && w.table === 'ad_campaigns')).toBe(true);
  const patch = writes.find((w) => w.method === 'PATCH')!;
  expect(patch.body).toMatchObject({ is_active: false, status: 'paused' });
});

test('empty state is shown when there are no campaigns', async ({ page }) => {
  await setup(page, [], []);
  await expect(page.locator('[data-testid="admin-ads-empty"]')).toBeVisible();
});

test('new campaign form validates input and creates campaign and banner', async ({ page }) => {
  const writes: Write[] = [];
  await setup(page, writes, []);

  await page.locator('[data-testid="admin-ads-new"]').click();
  await page.locator('[data-testid="ad-form-save"]').click();
  await expect(page.locator('[data-testid="ad-form-error"]')).toBeVisible();
  expect(writes).toHaveLength(0);

  await page.locator('[data-testid="ad-form-name"]').fill('Nova kampanja');
  await page.locator('[data-testid="ad-form-start"]').fill('2026-11-01');
  await page.locator('[data-testid="ad-form-end"]').fill('2026-12-01');
  await page.locator('[data-testid="ad-form-image"]').fill('http://nesigurno.example/baner.png');
  await page.locator('[data-testid="ad-form-target"]').fill('https://example.com/ponuda');
  await page.locator('[data-testid="ad-form-alt"]').fill('Opis banera');
  await page.locator('[data-testid="ad-form-save"]').click();
  await expect(page.locator('[data-testid="ad-form-error"]')).toContainText('https');
  expect(writes).toHaveLength(0);

  await page.locator('[data-testid="ad-form-image"]').fill('https://example.com/baner.png');
  await page.locator('[data-testid="ad-form-save"]').click();
  await expect.poll(() => writes.some((w) => w.table === 'ad_creatives' && w.method === 'POST')).toBe(true);

  const camp = writes.find((w) => w.table === 'ad_campaigns' && w.method === 'POST')!;
  expect(camp.body).toMatchObject({ slot_id: 's1', campaign_name: 'Nova kampanja', status: 'active', is_active: true });
  const creative = writes.find((w) => w.table === 'ad_creatives' && w.method === 'POST')!;
  expect(creative.body).toMatchObject({ campaign_id: 'new-campaign', image_url: 'https://example.com/baner.png', target_url: 'https://example.com/ponuda', alt_text: 'Opis banera' });
});

test('delete asks for confirmation and only deletes when accepted', async ({ page }) => {
  const writes: Write[] = [];
  await setup(page, writes);

  page.once('dialog', (d) => void d.dismiss());
  await page.locator('[data-testid="admin-ad-delete"]').click();
  await page.waitForTimeout(400);
  expect(writes.filter((w) => w.method === 'DELETE')).toHaveLength(0);

  page.once('dialog', (d) => void d.accept());
  await page.locator('[data-testid="admin-ad-delete"]').click();
  await expect.poll(() => writes.filter((w) => w.method === 'DELETE').map((w) => w.table)).toEqual(['ad_creatives', 'ad_campaigns']);
});

test('a failed delete shows an error instead of pretending it worked', async ({ page }) => {
  await setup(page, [], [campaign], false);
  page.once('dialog', (d) => void d.accept());
  await page.locator('[data-testid="admin-ad-delete"]').click();
  await expect(page.locator('[data-testid="admin-ads-error"]')).toContainText('nije uspjelo');
});

test('a live banner on the home page is always labelled as an ad', async ({ page }) => {
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];
    if (table === 'ad_slots') return fulfillJson(route, [{ id: 's1', supports_rotation: false }]);
    if (table === 'ad_campaigns') return fulfillJson(route, [{ id: 'c1', rotation_interval_seconds: 5 }]);
    if (table === 'ad_creatives') return fulfillJson(route, [{ id: 'cr1', image_url: 'https://example.com/baner.png', target_url: 'https://example.com', alt_text: 'Baner', weight: 1 }]);
    return fulfillJson(route, []);
  });
  await page.goto('/');
  await expect(page.locator('[data-testid="ad-slot-homepage-top"]')).toBeVisible();
  await expect(page.locator('[data-testid="ad-slot-homepage-top-label"]')).toHaveText('Oglas');
});
