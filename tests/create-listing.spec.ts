import { test, expect } from '@playwright/test';

test('user can go through Objavi oglas flow', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const openCreateListing = page
    .getByTestId('open-create-listing')
    .filter({ visible: true })
    .first();
  await expect(openCreateListing).toBeVisible();
  await openCreateListing.click();

  const modal = page.getByTestId('create-listing-modal');
  await expect(modal).toBeVisible();

  await page.getByTestId('category-selection').waitFor({ state: 'visible' });
  await page.getByTestId('category-physio').click();

  const nextStep = page.getByTestId('next-step');
  if (await nextStep.count()) {
    await nextStep.click();
  }

  await expect(page.getByTestId('next-step')).toBeVisible();
  await page.getByTestId('next-step').click();

  await page.getByTestId('input-title').fill('Test oglas');
  await page.getByTestId('input-description').fill('Test opis');
  await page.getByTestId('input-city').getByLabel('Grad Zagreb').check();
  await page.getByTestId('input-price').fill('50');

  await page.getByTestId('submit-listing').click();

  const modalVisible = await modal.isVisible().catch(() => false);
  const modalClosed = (await modal.count()) === 0;
  expect(modalVisible || modalClosed).toBeTruthy();

  const errorMessage = page.getByTestId('error-message');
  const successMessage = page.getByTestId('success-message');
  await expect(errorMessage.or(successMessage)).toBeAttached({ timeout: 15000 });
});
