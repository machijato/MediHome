import { test, expect, Page, Route } from '@playwright/test';

// UI testovi recenzija bez stvarnog Supabasea: svi zahtjevi prema REST/Auth API-ju su lažirani.

const LISTING_ID = '11111111-1111-1111-1111-111111111111';
const PROFILE_ID = '22222222-2222-2222-2222-222222222222';
const QUESTION_IDS = ['aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003'];

const listingRow = {
  id: LISTING_ID,
  slug: 'test-oglas',
  title: 'Testni oglas',
  description: 'Opis',
  price_from: 30,
  price_unit: 'EUR',
  city: 'Zagreb',
  provider_profile_id: PROFILE_ID,
  category_id: 'cat-1',
  status: 'approved',
  created_at: '2026-10-01T10:00:00Z',
  listing_images: [],
};

const reviewRow = {
  id: 'rev-1',
  listing_id: LISTING_ID,
  reviewer_user_id: 'someone-else',
  reviewer_name: 'Ana H.',
  rating: 4.5,
  comment: 'Vrlo ljubazno osoblje.',
  used_service_month: '2026-09-01',
  status: 'published',
  edited_by_moderator: false,
  created_at: '2026-10-05T10:00:00Z',
  listing_review_answers: [{ question_id: QUESTION_IDS[0], question_text: 'Kvaliteta usluge i stručnost', score: 5 }],
  review_replies: { reply_text: 'Hvala na povjerenju!', created_at: '2026-10-06T10:00:00Z' },
};

function fulfillJson(route: Route, data: unknown, extraHeaders: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: extraHeaders,
    body: JSON.stringify(body),
  });
}

async function mockApi(page: Page, opts: { reviews?: unknown[]; stats?: unknown; submitted?: unknown[]; homeUrls?: string[]; ownerProfile?: boolean; writes?: Array<{ url: string; body: unknown; method?: string }>; deleteResult?: unknown[] } = {}) {
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

  // Playwright prvo primjenjuje zadnje registriran route, pa se RPC pozivi obrađuju u jednom handleru ispod.
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1];

    if (table === 'rpc/submit_listing_review') {
      opts.submitted?.push(route.request().postDataJSON());
      return fulfillJson(route, 'new-review-id');
    }
    if (table === 'rpc/review_questions_for_listing') {
      return fulfillJson(route, [
        { id: QUESTION_IDS[0], sort_order: 1, question_text: 'Kvaliteta usluge i stručnost' },
        { id: QUESTION_IDS[1], sort_order: 2, question_text: 'Komunikacija i ljubaznost' },
        { id: QUESTION_IDS[2], sort_order: 3, question_text: 'Cijena kao dogovorena' },
      ]);
    }

    if (route.request().method() !== 'GET' && route.request().method() !== 'HEAD') {
      opts.writes?.push({ url: url.pathname, body: route.request().postDataJSON(), method: route.request().method() });
      return fulfillJson(route, route.request().method() === 'DELETE' ? (opts.deleteResult ?? []) : []);
    }

    switch (table) {
      case 'provider_listings':
        if (url.searchParams.get('slug')) return fulfillJson(route, [listingRow]);
        opts.homeUrls?.push(url.toString());
        return fulfillJson(
          route,
          [
            { ...listingRow, listing_rating_stats: { avg_rating: 4.5, review_count: 2 } },
            { ...listingRow, id: 'l2', slug: 'bez-ocjene', title: 'Oglas bez ocjena', listing_rating_stats: null },
          ],
          { 'content-range': '0-1/2' },
        );
      case 'service_categories':
        return fulfillJson(route, url.searchParams.get('id') ? [{ name: 'Fizioterapeut', slug: 'fizioterapeut' }] : [{ id: 'cat-1', slug: 'fizioterapeut' }]);
      case 'provider_profiles':
        // Provjera vlasništva: upit s user_id filterom vraća profil samo vlasniku.
        if (url.searchParams.get('user_id')) return fulfillJson(route, opts.ownerProfile ? [{ id: PROFILE_ID }] : []);
        return fulfillJson(route, [{ id: PROFILE_ID, display_name: 'Pružatelj d.o.o.', provider_type: 'physio', city: 'Zagreb', county: null, phone: null, email: null, website: null }]);
      case 'listing_rating_stats':
        return fulfillJson(route, opts.stats === undefined ? [{ review_count: 1, avg_rating: 4.5 }] : (opts.stats as unknown[]));
      case 'listing_question_stats':
        return fulfillJson(route, [{ question_id: QUESTION_IDS[0], question_text: 'Kvaliteta usluge i stručnost', avg_score: 5, answer_count: 1 }]);
      case 'listing_reviews':
        return fulfillJson(route, opts.reviews ?? [reviewRow]);
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

test('listing detail shows rating summary, unverified note, review and owner reply', async ({ page }) => {
  await mockApi(page);
  await page.goto('/oglas/test-oglas');

  await expect(page.locator('[data-testid="reviews-average"]')).toHaveText('4,5');
  await expect(page.locator('[data-testid="reviews-count"]')).toContainText('1 recenzija');
  await expect(page.locator('[data-testid="reviews-unverified-note"]').first()).toContainText('neprovjerene');
  await expect(page.locator('[data-testid="review-author"]')).toHaveText('Ana H.');
  await expect(page.locator('[data-testid="review-comment"]')).toContainText('Vrlo ljubazno osoblje.');
  await expect(page.locator('[data-testid="review-reply"]')).toContainText('Hvala na povjerenju!');
  // Neprijavljenom posjetitelju nudi se prijava, ne obrazac.
  await expect(page.locator('[data-testid="reviews-login-cta"]')).toBeVisible();
  await expect(page.locator('[data-testid="review-form"]')).toHaveCount(0);
});

test('listing without reviews shows empty state', async ({ page }) => {
  await mockApi(page, { reviews: [], stats: [] });
  await page.goto('/oglas/test-oglas');

  await expect(page.locator('[data-testid="reviews-empty"]')).toBeVisible();
  await expect(page.locator('[data-testid="review-item"]')).toHaveCount(0);
});

test('logged-in user must answer all questions and confirm before submitting a review', async ({ page }) => {
  const submitted: unknown[] = [];
  await mockApi(page, { reviews: [], stats: [], submitted });
  await page.goto('/oglas/test-oglas');
  await login(page);

  await page.locator('[data-testid="reviews-open-form"]').click();
  await expect(page.locator('[data-testid="review-form"]')).toBeVisible();

  // Bez odgovora ne šalje se ništa.
  await page.locator('[data-testid="review-submit"]').click();
  await expect(page.locator('[data-testid="review-error"]')).toContainText('sva pitanja');
  expect(submitted).toHaveLength(0);

  await page.locator('[data-testid="review-q1-5"]').click();
  await page.locator('[data-testid="review-q2-4"]').click();
  await page.locator('[data-testid="review-q3-3"]').click();

  // Bez potvrde korištenja usluge ne šalje se ništa.
  await page.locator('[data-testid="review-submit"]').click();
  await expect(page.locator('[data-testid="review-error"]')).toContainText('koristili ovu uslugu');
  expect(submitted).toHaveLength(0);

  await page.locator('[data-testid="review-comment-input"]').fill('Sve u redu.');
  await page.locator('[data-testid="review-confirm"]').check();
  await page.locator('[data-testid="review-submit"]').click();

  await expect(page.locator('[data-testid="review-form"]')).toHaveCount(0);
  expect(submitted).toHaveLength(1);
  const payload = submitted[0] as any;
  expect(payload.p_listing_id).toBe(LISTING_ID);
  expect(payload.p_confirmed).toBe(true);
  expect(payload.p_comment).toBe('Sve u redu.');
  expect(payload.p_answers).toEqual([
    { question_id: QUESTION_IDS[0], score: 5 },
    { question_id: QUESTION_IDS[1], score: 4 },
    { question_id: QUESTION_IDS[2], score: 3 },
  ]);
  expect(payload.p_used_month).toMatch(/^\d{4}-\d{2}-01$/);
});

test('home cards show real ratings and "Nema ocjena", and sort select drives the query', async ({ page }) => {
  const homeUrls: string[] = [];
  await mockApi(page, { homeUrls });
  await page.goto('/');

  await expect(page.locator('[data-testid="listing-card-rating"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="listing-card-rating"]')).toContainText('4,5');
  await expect(page.locator('[data-testid="listing-card-no-rating"]')).toHaveCount(1);

  // Zadano sortiranje: najbolje ocijenjeno.
  expect(homeUrls.some((u) => decodeURIComponent(u).includes('order=listing_rating_stats(avg_rating).desc'))).toBe(true);

  await page.locator('[data-testid="home-sort"]').selectOption('cijena-rastuce');
  await expect(page).toHaveURL(/sort=cijena-rastuce/);
  await expect.poll(() => homeUrls.some((u) => decodeURIComponent(u).includes('order=price_from.asc'))).toBe(true);
});

test('listing owner can reply to and report a review directly on the listing page', async ({ page }) => {
  const writes: Array<{ url: string; body: any }> = [];
  await mockApi(page, { ownerProfile: true, writes });
  await page.goto('/oglas/test-oglas');
  await login(page);

  await expect(page.locator('[data-testid="owner-reply-open"]')).toBeVisible();
  await page.locator('[data-testid="owner-reply-open"]').click();
  await page.locator('[data-testid="owner-reply-input"]').fill('Hvala na recenziji.');
  await page.locator('[data-testid="owner-reply-save"]').click();
  await expect.poll(() => writes.some((w) => w.url.endsWith('/review_replies'))).toBe(true);
  const reply = writes.find((w) => w.url.endsWith('/review_replies'))!;
  expect(JSON.stringify(reply.body)).toContain('Hvala na recenziji.');

  await page.locator('[data-testid="owner-report-open"]').click();
  await page.locator('[data-testid="owner-report-reason"]').selectOption('nije_koristio_uslugu');
  await page.locator('[data-testid="owner-report-send"]').click();
  await expect.poll(() => writes.some((w) => w.url.endsWith('/review_reports'))).toBe(true);
  const report = writes.find((w) => w.url.endsWith('/review_reports'))!;
  expect(report.body).toMatchObject({ review_id: 'rev-1', reason: 'nije_koristio_uslugu' });
});

test('a logged-in user who does not own the listing does not get owner actions', async ({ page }) => {
  await mockApi(page, { ownerProfile: false });
  await page.goto('/oglas/test-oglas');
  await login(page);

  await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="owner-reply-open"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="owner-report-open"]')).toHaveCount(0);
});

const myReviewRow = { ...reviewRow, id: 'rev-mine', reviewer_user_id: 'user-1', reviewer_name: 'Test K.', review_replies: null };

test('author can delete their own review after confirming', async ({ page }) => {
  const writes: Array<{ url: string; body: any; method?: string }> = [];
  let dialogMessage = '';
  await mockApi(page, { reviews: [myReviewRow], writes, deleteResult: [{ id: 'rev-mine' }] });
  await page.goto('/oglas/test-oglas');
  await login(page);

  await expect(page.locator('[data-testid="review-delete-own"]')).toBeVisible();
  page.once('dialog', (d) => {
    dialogMessage = d.message();
    void d.accept();
  });
  await page.locator('[data-testid="review-delete-own"]').click();

  await expect.poll(() => writes.filter((w) => w.method === 'DELETE').length).toBe(1);
  const del = writes.find((w) => w.method === 'DELETE')!;
  expect(del.url.endsWith('/listing_reviews')).toBe(true);
  expect(dialogMessage).toContain('obrisati svoju recenziju');
  await expect(page.locator('[data-testid="review-delete-error"]')).toHaveCount(0);
});

test('cancelling the confirmation does not delete the review', async ({ page }) => {
  const writes: Array<{ url: string; body: any; method?: string }> = [];
  await mockApi(page, { reviews: [myReviewRow], writes, deleteResult: [{ id: 'rev-mine' }] });
  await page.goto('/oglas/test-oglas');
  await login(page);

  page.once('dialog', (d) => void d.dismiss());
  await page.locator('[data-testid="review-delete-own"]').click();
  await page.waitForTimeout(500);
  expect(writes.filter((w) => w.method === 'DELETE')).toHaveLength(0);
  await expect(page.locator('[data-testid="review-delete-own"]')).toBeVisible();
});

test('failed delete (no row removed) shows an error and keeps the review', async ({ page }) => {
  await mockApi(page, { reviews: [myReviewRow], deleteResult: [] });
  await page.goto('/oglas/test-oglas');
  await login(page);

  page.once('dialog', (d) => void d.accept());
  await page.locator('[data-testid="review-delete-own"]').click();
  await expect(page.locator('[data-testid="review-delete-error"]')).toContainText('nije uspjelo');
  await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
});

test('delete button is not shown to visitors or to users without their own review', async ({ page }) => {
  await mockApi(page);
  await page.goto('/oglas/test-oglas');
  await expect(page.locator('[data-testid="review-delete-own"]')).toHaveCount(0);
  await login(page);
  await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="review-delete-own"]')).toHaveCount(0);
});
