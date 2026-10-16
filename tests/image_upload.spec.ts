import 'dotenv/config';
import { requireEnv } from './e2e-env';
import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function isSupabaseReachable(): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) return false;
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

const goFromCategoryToDetails = async (page: Page, specializations: string[] = []) => {
  await page.locator('[data-testid="category-fizioterapeut"]').click();

  // Selecting a category auto-advances the wizard from step 1 to step 2.
  await expect(page.getByText('Tip rada (moguće označiti oba)')).toBeVisible();

  for (const specialization of specializations) {
    await page.getByLabel(specialization).check();
  }

  // Step 2 contains service options; the next click moves to listing details (step 3).
  await page.locator('[data-testid="next-step"]').click();
  await expect(page.locator('[data-testid="input-title"]')).toBeVisible();
};

const goFromDetailsToImages = async (page: Page) => {
  await page.locator('[data-testid="next-step"]').click();

  // Step 4 is the image-upload step; the file input is hidden but attached in this step.
  await expect(page.locator('[data-testid="image-upload-label"]')).toBeVisible();
  await expect(page.locator('[data-testid="image-upload-input"]')).toBeAttached();
};

test('authenticated user can upload image during listing creation', async ({ page }) => {
  const reachable = await isSupabaseReachable();
  if (!reachable) {
    console.log('Supabase not reachable in CI — skipping auth test');
    test.skip();
    return;
  }

  test.setTimeout(90000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const authUserChip = page.locator('[data-testid="auth-user-chip"]');
  if (!(await authUserChip.isVisible())) {
    await page.locator('[data-testid="open-auth-modal"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    await page.locator('[data-testid="auth-email-input"]').fill(
      requireEnv('E2E_AUTH_EMAIL')
    );
    await page.locator('[data-testid="auth-password-input"]').fill(
      requireEnv('E2E_AUTH_PASSWORD')
    );
    await page.locator('[data-testid="auth-submit-button"]').click();
    await expect(authUserChip).toBeVisible({ timeout: 20000 });
  }

  const opener = page.locator('[data-testid="open-create-listing"]').first();
  await expect(opener).toBeVisible();
  await opener.click();

  const modal = page.locator('[data-testid="create-listing-modal"]');
  await expect(modal).toBeVisible();

  await goFromCategoryToDetails(page, ['Neurološka fizioterapija']);

  const uniqueTitle = `E2E Image Upload Test ${Date.now()}`;
  await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
  await page.locator('[data-testid="input-price"]').fill('50');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Test upload slike.');
  await goFromDetailsToImages(page);

  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64, 'base64');

  await page.locator('[data-testid="image-upload-input"]').setInputFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer,
  });

  await expect(page.locator('[data-testid="image-upload-preview"]')).toBeVisible({ timeout: 5000 });

  await expect(page.locator('[data-testid="submit-listing"]')).toBeEnabled();
  await page.locator('[data-testid="submit-listing"]').click();

  await expect(
    page.locator('[data-testid="listing-submit-success"]')
  ).toBeVisible({ timeout: 40000 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Sign in as the test user to get authenticated session for cleanup
  await supabase.auth.signInWithPassword({
    email: requireEnv('E2E_AUTH_EMAIL'),
    password: requireEnv('E2E_AUTH_PASSWORD'),
  });

  // Cleanup by exact title
  const { data: listingToDelete } = await supabase
    .from('provider_listings')
    .select('id')
    .eq('title', uniqueTitle)
    .maybeSingle();

  let savedOptionsCount = 0;
  let savedOptionsErrorMessage: string | undefined;
  let storagePathCount = 0;
  let removedFileCount = 0;
  let removeErrorMessage: string | undefined;

  if (listingToDelete?.id) {
    const { data: savedOptions, error: savedOptionsError } = await supabase
      .from('listing_selected_options')
      .select('id')
      .eq('listing_id', listingToDelete.id);
    savedOptionsCount = savedOptions?.length ?? 0;
    savedOptionsErrorMessage = savedOptionsError?.message;

    // Datoteku slike brišemo prije retka oglasa (pravilo za brisanje provjerava vlasništvo preko oglasa).
    const { data: imageRows } = await supabase
      .from('listing_images')
      .select('storage_path')
      .eq('listing_id', listingToDelete.id);
    const storagePaths = (imageRows ?? []).map((row) => row.storage_path).filter((path): path is string => Boolean(path));
    storagePathCount = storagePaths.length;
    if (storagePaths.length > 0) {
      const { data: removedFiles, error: removeError } = await supabase.storage.from('listing-images').remove(storagePaths);
      removedFileCount = removedFiles?.length ?? 0;
      removeErrorMessage = removeError?.message;
    }

    await supabase.from('listing_images').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('listing_selected_options').delete().eq('listing_id', listingToDelete.id);
    await supabase.from('provider_listings').delete().eq('id', listingToDelete.id);
  }

  // Odjava samo lokalne sesije: globalna odjava poništi i prijavu preglednika u drugim testovima koji teku paralelno
  await supabase.auth.signOut({ scope: 'local' });

  // Provjere tek nakon čišćenja, da neuspjeh ne ostavi test podatke u bazi.
  expect(savedOptionsErrorMessage, 'Reading selected options as owner failed.').toBeUndefined();
  // Specijalizacija + zadani tip rada „teren" (oba moraju postojati u service_options).
  expect(savedOptionsCount, 'Selected specialization and work type should be saved for the new listing.').toBeGreaterThanOrEqual(2);
  expect(storagePathCount, 'Expected the uploaded image to be stored with a storage_path.').toBeGreaterThan(0);
  expect(removeErrorMessage, 'Removing uploaded image file from storage failed.').toBeUndefined();
  expect(removedFileCount, 'Storage delete policy should allow the owner to delete the uploaded file.').toBe(storagePathCount);
});

test('user can skip image upload', async ({ page }) => {
  const reachable = await isSupabaseReachable();
  if (!reachable) {
    console.log('Supabase not reachable in CI — skipping auth test');
    test.skip();
    return;
  }

  test.setTimeout(90000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const authUserChip = page.locator('[data-testid="auth-user-chip"]');
  if (!(await authUserChip.isVisible())) {
    await page.locator('[data-testid="open-auth-modal"]').click();
    await page.locator('[data-testid="auth-email-input"]').fill(
      requireEnv('E2E_AUTH_EMAIL')
    );
    await page.locator('[data-testid="auth-password-input"]').fill(
      requireEnv('E2E_AUTH_PASSWORD')
    );
    await page.locator('[data-testid="auth-submit-button"]').click();
    await expect(authUserChip).toBeVisible({ timeout: 20000 });
  }

  const opener = page.locator('[data-testid="open-create-listing"]').first();
  await opener.click();
  const modal = page.locator('[data-testid="create-listing-modal"]');
  await expect(modal).toBeVisible();

  await goFromCategoryToDetails(page);

  const uniqueTitle = `E2E Skip Image Test ${Date.now()}`;
  await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
  await page.locator('[data-testid="input-price"]').fill('40');
  await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
  await page.locator('[data-testid="input-description"]').fill('Test skip upload.');
  await goFromDetailsToImages(page);

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
    email: requireEnv('E2E_AUTH_EMAIL'),
    password: requireEnv('E2E_AUTH_PASSWORD'),
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

  // Odjava samo lokalne sesije: globalna odjava poništi i prijavu preglednika u drugim testovima koji teku paralelno
  await supabase.auth.signOut({ scope: 'local' });
});
