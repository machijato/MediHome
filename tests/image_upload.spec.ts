import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.afterAll(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Cleanup warning: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Delete related images first (foreign key constraint)
  const { data: testListings } = await supabase
    .from('provider_listings')
    .select('id')
    .like('title', 'E2E%');

  if (testListings && testListings.length > 0) {
    const ids = testListings.map((listing) => listing.id);
    await supabase.from('listing_images').delete().in('listing_id', ids);
    await supabase.from('listing_selected_options').delete().in('listing_id', ids);
    await supabase.from('provider_listings').delete().like('title', 'E2E%');
  }
});

test('authenticated user can upload image during listing creation', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const authUserChip = page.locator('[data-testid="auth-user-chip"]');
  if (!(await authUserChip.isVisible())) {
    await page.locator('[data-testid="open-auth-modal"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    await page.locator('[data-testid="auth-email-input"]').fill(
      process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com'
    );
    await page.locator('[data-testid="auth-password-input"]').fill(
      process.env.E2E_AUTH_PASSWORD ?? 'Maki4321'
    );
    await page.locator('[data-testid="auth-submit-button"]').click();
    await expect(authUserChip).toBeVisible({ timeout: 20000 });
  }

  const opener = page.locator('[data-testid="open-create-listing"]').first();
  await expect(opener).toBeVisible();
  await opener.click();

  const modal = page.locator('[data-testid="create-listing-modal"]');
  await expect(modal).toBeVisible();

  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();

  const uniqueTitle = `E2E Image Upload Test ${Date.now()}`;
  await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
  await page.locator('[data-testid="input-price"]').fill('50');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Test upload slike.');
  await page.locator('[data-testid="next-step"]').click();

  await expect(page.locator('[data-testid="image-upload-input"]')).toBeAttached();

  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64, 'base64');

  await page.locator('[data-testid="image-upload-input"]').setInputFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer,
  });

  await expect(page.locator('[data-testid="image-upload-preview"]')).toBeVisible({ timeout: 5000 });

  await page.locator('[data-testid="submit-listing"]').click();

  await expect(modal).not.toBeVisible({ timeout: 20000 });
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });

  await page.waitForTimeout(2000);

  const listingCard = page.locator('[data-testid="listing-card"]')
    .filter({ hasText: uniqueTitle })
    .first();
  await expect(listingCard).toBeVisible({ timeout: 10000 });

  const cardImage = listingCard.locator('[data-testid="listing-card-image"]');
  await expect(cardImage).toBeVisible({ timeout: 5000 });
  const imageSrc = await cardImage.getAttribute('src');
  expect(imageSrc).not.toMatch(/picsum\.photos/);
  expect(imageSrc).toBeTruthy();

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Cleanup: delete test listing from database
  const { error: cleanupError } = await supabase
    .from('provider_listings')
    .delete()
    .like('title', 'E2E%');

  if (cleanupError) {
    console.warn('Cleanup warning:', cleanupError.message);
  }
});

test('user can skip image upload', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const authUserChip = page.locator('[data-testid="auth-user-chip"]');
  if (!(await authUserChip.isVisible())) {
    await page.locator('[data-testid="open-auth-modal"]').click();
    await page.locator('[data-testid="auth-email-input"]').fill(
      process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com'
    );
    await page.locator('[data-testid="auth-password-input"]').fill(
      process.env.E2E_AUTH_PASSWORD ?? 'Maki4321'
    );
    await page.locator('[data-testid="auth-submit-button"]').click();
    await expect(authUserChip).toBeVisible({ timeout: 20000 });
  }

  const opener = page.locator('[data-testid="open-create-listing"]').first();
  await opener.click();
  const modal = page.locator('[data-testid="create-listing-modal"]');
  await expect(modal).toBeVisible();

  await page.locator('[data-testid="category-fizioterapeut"]').click();
  await page.locator('[data-testid="next-step"]').click();

  const uniqueTitle = `E2E Skip Image Test ${Date.now()}`;
  await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
  await page.locator('[data-testid="input-price"]').fill('40');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Test skip upload.');
  await page.locator('[data-testid="next-step"]').click();

  await expect(page.locator('[data-testid="skip-image-upload"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="skip-image-upload"]').click();

  await expect(modal).not.toBeVisible({ timeout: 20000 });
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Cleanup: delete test listing from database
  const { error: cleanupError } = await supabase
    .from('provider_listings')
    .delete()
    .like('title', 'E2E%');

  if (cleanupError) {
    console.warn('Cleanup warning:', cleanupError.message);
  }
});
