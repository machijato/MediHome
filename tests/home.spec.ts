import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});

test('create listing modal can be opened from unified CTA flow', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const homepageCtaOpener = page.getByTestId('open-create-listing-cta');
  const navbarOpener = page.getByTestId('open-create-listing');

  let openerUsed: 'homepage-cta' | 'navbar' | null = null;

  if (await homepageCtaOpener.isVisible()) {
    openerUsed = 'homepage-cta';
    await homepageCtaOpener.click();
  } else if (await navbarOpener.isVisible()) {
    openerUsed = 'navbar';
    await navbarOpener.click();
  }

  console.log(`[create-listing-flow] opener used: ${openerUsed ?? 'none'}`);
  expect(openerUsed).not.toBeNull();

  await expect(page.getByRole('heading', { name: 'Objavi oglas' })).toBeVisible();
  await expect(page.getByText('Korak 1 od 3')).toBeVisible();

  // Keep existing wizard flow after opening unchanged; select category to move forward.
  await page.getByRole('button', { name: 'Fizioterapeut' }).click();
  await expect(page.getByText('Korak 2 od 3')).toBeVisible();
});
