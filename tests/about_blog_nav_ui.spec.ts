import { test, expect, Page, Route } from '@playwright/test';

// Stranica "O nama", gumb "Saznaj više" i navigacija prema blogu (zaglavlje, mobilni izbornik, podnožje). Lažirani API.

function fulfillJson(route: Route, data: unknown, headers: Record<string, string> = {}) {
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const body = wantsObject && Array.isArray(data) ? (data[0] ?? null) : data;
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range', ...headers }, body: JSON.stringify(body) });
}

async function mockApi(page: Page) {
  await page.route('**/rest/v1/**', (route) => {
    const table = new URL(route.request().url()).pathname.split('/rest/v1/')[1];
    if (table === 'content_items') {
      return fulfillJson(route, [{ id: 'a1', title: 'Prvi članak', slug: 'prvi-clanak', excerpt: 'Kratki opis', category_key: 'savjeti', published_at: '2026-10-01T10:00:00Z' }]);
    }
    return fulfillJson(route, []);
  });
}

test('"Saznaj više" in the blue banner opens the About page', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  const learnMore = page.locator('[data-testid="learn-more-cta"]');
  await expect(learnMore).toHaveAttribute('href', '/o-nama');
  await learnMore.click();
  await expect(page).toHaveURL(/\/o-nama$/);
  await expect(page.locator('[data-testid="about-title"]')).toHaveText('O nama');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('About page has working links and opens the listing form for providers', async ({ page }) => {
  await mockApi(page);
  await page.goto('/o-nama');
  await expect(page.locator('[data-testid="about-page"]')).toBeVisible();
  await page.locator('[data-testid="about-blog-link"]').click();
  await expect(page).toHaveURL(/\/clanci$/);
  await expect(page.locator('[data-testid="article-card"]')).toHaveCount(1);

  await page.goto('/o-nama');
  await page.locator('[data-testid="about-post-ad"]').click();
  await expect(page.getByRole('heading', { name: 'Objavi oglas' })).toBeVisible();
});

test('header links lead to About and Blog on desktop', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeHidden();

  await page.locator('[data-testid="nav-blog-link"]').click();
  await expect(page).toHaveURL(/\/clanci$/);
  await expect(page.locator('[data-testid="articles-page"]')).toBeVisible();
  await expect(page.locator('[data-testid="nav-blog-link"]')).toHaveClass(/text-primary/);

  await page.locator('[data-testid="nav-about-link"]').click();
  await expect(page).toHaveURL(/\/o-nama$/);
  await expect(page.locator('[data-testid="about-page"]')).toBeVisible();
});

test('footer has About and Blog links', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.locator('[data-testid="footer-about-link"]').click();
  await expect(page).toHaveURL(/\/o-nama$/);
  await page.locator('[data-testid="footer-articles-link"]').click();
  await expect(page).toHaveURL(/\/clanci$/);
  await expect(page.locator('[data-testid="footer-articles-link"]')).toHaveText('Blog i članci');
});

test('mobile menu opens, navigates and closes; it can also start posting a listing', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.locator('[data-testid="main-nav"]')).toBeHidden();
  await expect(page.locator('[data-testid="mobile-menu"]')).toHaveCount(0);

  await page.locator('[data-testid="mobile-menu-toggle"]').click();
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  await page.locator('[data-testid="mobile-nav-blog-link"]').click();
  await expect(page).toHaveURL(/\/clanci$/);
  await expect(page.locator('[data-testid="mobile-menu"]')).toHaveCount(0);

  await page.locator('[data-testid="mobile-menu-toggle"]').click();
  await page.locator('[data-testid="mobile-nav-about-link"]').click();
  await expect(page).toHaveURL(/\/o-nama$/);

  await page.locator('[data-testid="mobile-menu-toggle"]').click();
  await page.locator('[data-testid="mobile-open-create-listing"]').click();
  await expect(page.getByRole('heading', { name: 'Objavi oglas' })).toBeVisible();
});
