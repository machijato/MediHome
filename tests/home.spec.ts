import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');

  // čekaj da se React mounta
  await page.waitForSelector('#root');

  // provjeri da postoji neki tekst
  const bodyText = await page.textContent('body');
  expect((bodyText ?? '').length).toBeGreaterThan(20);

  // dodatno: provjeri da URL postoji
  await expect(page).toHaveURL(/vercel\.app/);
});
