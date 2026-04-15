import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/vercel\.app/);

  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);
});

test('create listing modal opens', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const diagnosticScreenshot = testInfo.outputPath('homepage-before-create-listing-click.png');
  await page.screenshot({ path: diagnosticScreenshot, fullPage: true });
  console.log(`Diagnostic screenshot saved to: ${diagnosticScreenshot}`);

  const testIds = await page.locator('[data-testid]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-testid'))
      .filter((testId): testId is string => Boolean(testId))
  );

  console.log(`Homepage data-testid values: ${JSON.stringify(testIds, null, 2)}`);
  console.log(`Current URL: ${page.url()}`);
  console.log(`Page title: ${await page.title()}`);

  const openCreateListingCount = await page.locator('[data-testid="open-create-listing"]').count();
  const openCreateListingCtaCount = await page.locator('[data-testid="open-create-listing-cta"]').count();
  const createListingModalCount = await page.locator('[data-testid="create-listing-modal"]').count();

  console.log(`Exists [open-create-listing]: ${openCreateListingCount > 0}`);
  console.log(`Exists [open-create-listing-cta]: ${openCreateListingCtaCount > 0}`);
  console.log(`Exists [create-listing-modal]: ${createListingModalCount > 0}`);
  console.log(`Count [data-testid="open-create-listing"]: ${openCreateListingCount}`);
  console.log(`Count [data-testid="open-create-listing-cta"]: ${openCreateListingCtaCount}`);

  await page.locator('[data-testid="open-create-listing"]').click();
  await expect(page.locator('[data-testid="create-listing-modal"]')).toBeVisible();
});
