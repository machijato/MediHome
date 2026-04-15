import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
  const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();

  const useNavbarOpener = (await navbarOpener.count()) > 0 && await navbarOpener.isVisible();
  const opener = useNavbarOpener ? navbarOpener : ctaOpener;

  await expect(opener).toBeVisible();
  await opener.click();

  await expect(page.getByRole('heading', { name: 'Objavi oglas' })).toBeVisible();

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});
