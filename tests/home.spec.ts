import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test('authenticated user can create listing, see it on homepage, and open detail page', async ({ page }) => {
  test.setTimeout(90000);
  const uniqueTitle = `E2E Auth Oglas ${Date.now()}`;
  const diagnosticsPrefix = `auth-flow-${Date.now()}`;
  const browserLogs: string[] = [];
  const pageErrors: string[] = [];

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for DB verification in E2E test.');
  }

  const verificationSupabase = createClient(supabaseUrl, supabaseAnonKey);

  page.on('console', (msg) => {
    const log = `[${msg.type()}] ${msg.text()}`;
    browserLogs.push(log);
    console.log('BROWSER LOG:', log);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  const captureDiagnostics = async (label: string) => {
    console.log('DIAGNOSTIC LABEL:', label);
    try {
      console.log('URL:', page.url());
    } catch (error) {
      console.log('DIAGNOSTICS URL unavailable:', error);
    }
    try {
      console.log('TITLE:', await page.title());
    } catch (error) {
      console.log('DIAGNOSTICS TITLE unavailable (likely page/context/browser closed):', error);
    }
    try {
      const testIds = await page.locator('[data-testid]').evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-testid'))
      );
      console.log('DATA TESTIDS:', testIds);
    } catch (error) {
      console.log('DIAGNOSTICS DATA TESTIDS unavailable (likely page/context/browser closed):', error);
    }
    console.log('BROWSER LOGS CAPTURED:', browserLogs);
    console.log('PAGE ERRORS CAPTURED:', pageErrors);
    try {
      await page.screenshot({ path: `${diagnosticsPrefix}-${label}.png`, fullPage: true });
    } catch (error) {
      console.log('DIAGNOSTICS SCREENSHOT unavailable (likely page/context/browser closed):', error);
    }
  };

  try {
    console.log('E2E STEP: before page.goto');
    await page.goto('/');
    console.log('E2E STEP: after page.goto');
    await page.waitForLoadState('domcontentloaded');

    const authUserChip = page.locator('[data-testid="auth-user-chip"]');
    if (!(await authUserChip.isVisible())) {
      console.log('E2E STEP: before opening auth modal');
      await expect(page.locator('[data-testid="open-auth-modal"]')).toBeVisible();
      await page.locator('[data-testid="open-auth-modal"]').click();
      await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
      console.log('E2E STEP: after auth modal visible');

      await page.locator('[data-testid="auth-email-input"]').fill(process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com');
      await page.locator('[data-testid="auth-password-input"]').fill(process.env.E2E_AUTH_PASSWORD ?? 'Maki4321');

      console.log('E2E STEP: before clicking auth submit');
      await page.locator('[data-testid="auth-submit-button"]').click();
      console.log('E2E STEP: after clicking auth submit');
      await expect(
        authUserChip,
        'Timed out waiting for authenticated user chip after login submit.'
      ).toBeVisible({ timeout: 20000 });
      console.log('E2E STEP: after auth-user-chip visible');
    }

    const navbarOpener = page.locator('[data-testid="open-create-listing"]').first();
    const ctaOpener = page.locator('[data-testid="open-create-listing-cta"]').first();
    const opener = (await navbarOpener.isVisible()) ? navbarOpener : ctaOpener;

    console.log('E2E STEP: before opening create-listing modal');
    await expect(opener).toBeVisible();
    await opener.click();

    const modal = page.locator('[data-testid="create-listing-modal"]');
    await expect(modal).toBeVisible();
    console.log('E2E STEP: after create-listing-modal visible');

    await page.locator('[data-testid="category-fizioterapeut"]').click();
    await page.locator('[data-testid="next-step"]').click();

    await page.locator('[data-testid="input-title"]').fill(uniqueTitle);
    await page.locator('[data-testid="input-price"]').fill('30');
    await page.locator('[data-testid="input-city"] input[type="checkbox"]').first().check();
    await page.locator('[data-testid="input-description"]').fill('Automated authenticated wizard submit flow check.');
    await page.locator('[data-testid="next-step"]').click();

    await page.locator('[data-testid="submit-listing"]').click();

    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      const errorText = (await errorMessage.textContent())?.trim() || '<empty error-message>';
      throw new Error(`Create listing failed with visible error-message: ${errorText}`);
    }

    await expect(
      modal,
      'Timed out waiting for create-listing modal to close after submit.'
    ).not.toBeVisible({ timeout: 20000 });

    const createdListingTitle = page.getByText(uniqueTitle);
    await expect(
      createdListingTitle,
      `Timed out waiting for new listing title "${uniqueTitle}" to appear in UI.`
    ).toBeVisible({ timeout: 20000 });

    const { data: listing, error: queryError } = await verificationSupabase
      .from('provider_listings')
      .select('title, slug, status, category_id, provider_profile_id')
      .eq('title', uniqueTitle)
      .maybeSingle();

    if (queryError) {
      throw new Error(`Supabase verification query failed for title "${uniqueTitle}": ${queryError.message}`);
    }

    expect(listing, `No provider_listings row found for title "${uniqueTitle}"`).toBeTruthy();
    expect(listing?.slug, 'Expected provider_listings.slug to be present.').toBeTruthy();
    expect(listing?.status, 'Expected provider_listings.status to be approved.').toBe('approved');
    expect(listing?.category_id, 'Expected provider_listings.category_id to be present.').toBeTruthy();
    expect(listing?.provider_profile_id, 'Expected provider_listings.provider_profile_id to be present.').toBeTruthy();

    await expect(page).toHaveURL(/\/$/);

    const listingCardLink = page.locator('[data-testid="listing-card"]').filter({ hasText: uniqueTitle }).first();
    await expect(listingCardLink, `Expected listing card for "${uniqueTitle}" to be visible.`).toBeVisible({ timeout: 20000 });
    await listingCardLink.click();

    await expect(page).toHaveURL(/\/oglas\//);
    await expect(page.locator('[data-testid="listing-detail-page"]')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="listing-detail-title"]')).toHaveText(uniqueTitle);
    await expect(page.locator('[data-testid="listing-detail-description"]')).toHaveText(
      'Automated authenticated wizard submit flow check.'
    );

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Sign in as the test user to get authenticated session for cleanup
    await supabase.auth.signInWithPassword({
      email: process.env.E2E_AUTH_EMAIL ?? 'makiblaz@gmail.com',
      password: process.env.E2E_AUTH_PASSWORD ?? 'Maki4321',
    });

    // Get listing id by unique title
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
  } catch (error) {
    await captureDiagnostics('failure');
    throw error;
  }
});
