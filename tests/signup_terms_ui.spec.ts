import { test, expect, Page } from '@playwright/test';

// Registracija traži prihvaćanje Uvjeta i Politike privatnosti. Lažirani API (nema stvarne registracije).

async function openRegister(page: Page, signupBodies: any[]) {
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range' }, body: '[]' }),
  );
  await page.route('**/auth/v1/signup**', async (route) => {
    signupBodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ id: '00000000-0000-4000-8000-000000000009', aud: 'authenticated', email: 'novi@example.com', user_metadata: {}, app_metadata: {}, created_at: '2026-10-22T00:00:00Z' }),
    });
  });
  await page.goto('/');
  await page.locator('[data-testid="open-auth-modal"]').click();
  await page.locator('[data-testid="auth-modal"]').getByRole('button', { name: 'Registracija', exact: true }).click();
}

test('registration is blocked until the terms checkbox is ticked', async ({ page }) => {
  const bodies: any[] = [];
  await openRegister(page, bodies);

  await page.locator('#auth-full-name').fill('Novi Korisnik');
  await page.locator('[data-testid="auth-email-input"]').fill('novi@example.com');
  await page.locator('[data-testid="auth-password-input"]').fill('lozinka123');
  await expect(page.locator('[data-testid="auth-terms-checkbox"]')).not.toBeChecked();

  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.getByText('Za registraciju morate prihvatiti Uvjete korištenja i Politiku privatnosti.')).toBeVisible();
  expect(bodies).toHaveLength(0);

  await page.locator('[data-testid="auth-terms-checkbox"]').check();
  await page.locator('[data-testid="auth-submit-button"]').click();
  await expect(page.getByText('Provjerite email za potvrdu računa.')).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0].data.full_name).toBe('Novi Korisnik');
  expect(new Date(bodies[0].data.terms_accepted_at).getTime()).toBeGreaterThan(Date.now() - 60_000);
});

test('terms and privacy links open in a new tab; login tab has no checkbox; checkbox resets', async ({ page }) => {
  const bodies: any[] = [];
  await openRegister(page, bodies);

  await expect(page.locator('[data-testid="auth-terms-link"]')).toHaveAttribute('href', '/uvjeti-koristenja');
  await expect(page.locator('[data-testid="auth-terms-link"]')).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-testid="auth-privacy-link"]')).toHaveAttribute('href', '/politika-privatnosti');

  await page.locator('[data-testid="auth-terms-checkbox"]').check();
  await page.locator('[data-testid="auth-modal"]').getByRole('button', { name: 'Prijava', exact: true }).click();
  await expect(page.locator('[data-testid="auth-terms-checkbox"]')).toHaveCount(0);

  await page.locator('[data-testid="auth-modal"]').getByRole('button', { name: 'Registracija', exact: true }).click();
  await expect(page.locator('[data-testid="auth-terms-checkbox"]')).not.toBeChecked();
});
