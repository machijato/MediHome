import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();
  const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();

  const useCtaOpener = (await ctaOpener.count()) > 0 && await ctaOpener.isVisible();
  const opener = useCtaOpener ? ctaOpener : navbarOpener;

  console.log(`Using modal opener: ${useCtaOpener ? 'open-create-listing-cta' : 'open-create-listing'}`);

  await expect(opener).toBeVisible();
  await opener.click();
  await expect(page.getByRole('heading', { name: 'Objavi oglas' })).toBeVisible();

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});
