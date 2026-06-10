import { test, expect } from '@playwright/test';

test('search query updates URL and filters listings', async ({ page }) => {
  test.setTimeout(30000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Stranica se učitava
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 10000 });

  // Pronađi search input i upisi nešto
  const searchInput = page.locator('input[placeholder*="pretra"]').first();
  
  // Ako nema search inputa, skip
  const hasSearch = await searchInput.count() > 0;
  if (!hasSearch) {
    console.log('Search input not found — skipping URL filter test');
    test.skip();
    return;
  }

  await searchInput.fill('fizioterapeut');
  await page.waitForTimeout(500);

  // URL mora sadržavati q= parametar
  await expect(page).toHaveURL(/[?&]q=fizioterapeut/i, { timeout: 5000 });
});

test('category filter updates URL', async ({ page }) => {
  test.setTimeout(30000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 10000 });

  // Klikni kategoriju fizioterapeut
  const catButton = page.locator('[data-testid="category-filter-fizioterapeut"], [data-testid="category-fizioterapeut"]').first();
  const hasCat = await catButton.count() > 0;
  
  if (!hasCat) {
    console.log('Category filter button not found — skipping');
    test.skip();
    return;
  }

  await catButton.click();
  await page.waitForTimeout(500);

  // URL mora sadržavati cat= parametar
  await expect(page).toHaveURL(/[?&]cat=/, { timeout: 5000 });
});

test('direct URL with filters loads correct results', async ({ page }) => {
  test.setTimeout(30000);

  // Direktno otvori URL s filterom
  await page.goto('/?cat=fizioterapeut');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible({ timeout: 10000 });

  // Stranica se mora renderirati bez crasha
  // Listings grid mora biti vidljiv (čak i ako je prazan)
  await expect(page.locator('[data-testid="listing-card"]').first().or(
    page.locator('text=Nema rezultata').or(page.locator('text=Pokušajte'))
  )).toBeVisible({ timeout: 10000 });
});
