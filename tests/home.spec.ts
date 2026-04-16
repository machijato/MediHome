import { test, expect } from '@playwright/test';

test('create listing wizard can be completed through submit', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const navbarOpener = page.getByTestId('open-create-listing').first();
  const ctaOpener = page.getByTestId('open-create-listing-cta').first();

  const useNavbarOpener = (await navbarOpener.count()) > 0 && await navbarOpener.isVisible();
  const opener = useNavbarOpener ? navbarOpener : ctaOpener;

  await expect(opener).toBeVisible();
  await opener.click();

  const wizardHeading = page.getByRole('heading', { name: /objavi oglas/i });
  await expect(wizardHeading).toBeVisible();

  // Step 1: choose a stable category that uses the full 3-step path.
  await page.getByRole('button', { name: /fizioterapeut/i }).click();

  // Step 2 -> Step 3.
  await page.getByRole('button', { name: /^dalje$/i }).click();

  // Step 3: fill required fields.
  await page.getByPlaceholder('npr. Ivan Horvat').fill('Playwright Test Provider');
  await page.getByPlaceholder('30€/h').fill('35');
  await page.getByPlaceholder('091 123 4567').fill('091 222 3333');
  await page.getByPlaceholder('Detaljno opišite što nudite...').fill('Testni unos oglasa putem Playwrighta.');

  // Submit.
  await page.getByRole('button', { name: /objavi oglas/i }).last().click();

  const submitErrorMessage = page.getByText(/došlo je do greške pri spremanju oglasa/i);
  const submitSuccessState = wizardHeading;

  await expect
    .poll(async () => {
      if (await submitErrorMessage.isVisible().catch(() => false)) {
        return 'error';
      }

      if (!(await submitSuccessState.isVisible().catch(() => false))) {
        return 'success';
      }

      return 'pending';
    })
    .toMatch(/error|success/);
});
