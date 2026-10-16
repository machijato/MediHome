import { test, expect } from '@playwright/test';

// Kad dohvat oglasa ne uspije, posjetitelj mora vidjeti poruku o grešci, a ne izmišljene pružatelje.
// Ne treba stvarni Supabase: zahtjevi prema REST API-ju se prekidaju.

test('failed listings fetch shows an error message instead of fake providers', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.abort());

  await page.goto('/');

  await expect(page.locator('[data-testid="listings-load-error"]')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Ivan Horvat')).toHaveCount(0);
  await expect(page.locator('[data-testid="listing-card-image"]')).toHaveCount(0);
});
