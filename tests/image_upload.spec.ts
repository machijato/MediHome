import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

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

  await expect(
    page.locator('[data-testid="listing-submit-success"]')
  ).toBeVisible({ timeout: 20000 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Sign in as the test user to get authenticated session for cleanup
  await supabase.auth.signInWithPassword({
    email: process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com',
    password: process.env.E2E_AUTH_PASSWORD ?? 'Maki4321',
  });

  // Cleanup by exact title
  const { data: listingToDelete } = await supabase
    .from('provider_listings')
    .select('id')
    .eq('title', uniqueTitle)
    .maybeSingle();

  if (listingToDelete?.id) {
    await supabase.from('listing_images').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('listing_selected_options').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('provider_listings').delete().eq('id', listingToDelete.id);
  }

  // Sign out after cleanup
  await supabase.auth.signOut();
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

  await expect(
    page.locator('[data-testid="listing-submit-success"]')
  ).toBeVisible({ timeout: 20000 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Sign in as the test user to get authenticated session for cleanup
  await supabase.auth.signInWithPassword({
    email: process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com',
    password: process.env.E2E_AUTH_PASSWORD ?? 'Maki4321',
  });

  // Cleanup by exact title
  const { data: listingToDelete } = await supabase
    .from('provider_listings')
    .select('id')
    .eq('title', uniqueTitle)
    .maybeSingle();

  if (listingToDelete?.id) {
    await supabase.from('listing_images').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('listing_selected_options').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('provider_listings').delete().eq('id', listingToDelete.id);
  }

  // Sign out after cleanup
  await supabase.auth.signOut();
});
