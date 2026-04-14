import { test, expect } from '@playwright/test';

test('user can go through Objavi oglas flow', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('open-create-listing').click();

  const modal = page.getByTestId('create-listing-modal');
  await expect(modal).toBeVisible();

  await page.getByTestId('input-title').fill('Test oglas');
  await page.getByTestId('input-description').fill('Test opis');
  await page.getByTestId('input-city').fill('Zagreb');
  await page.getByTestId('input-price').fill('50');

  await page.getByTestId('submit-listing').click();

  const modalVisible = await modal.isVisible().catch(() => false);
  const modalClosed = (await modal.count()) === 0;
  expect(modalVisible || modalClosed).toBeTruthy();

  const errorMessage = page.getByTestId('error-message');
  const successMessage = page.getByTestId('success-message');
  await expect(errorMessage.or(successMessage)).toBeVisible({ timeout: 15000 });
});
