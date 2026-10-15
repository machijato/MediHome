import { test, expect } from '@playwright/test';

// Ne treba stvarni Supabase: odgovori auth API-ja su simulirani, a provjerava se da aplikacija
// iz linka za reset lozinke postavi sesiju (inače updateUser vraća "Auth session missing!").

const base64Url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const fakeUser = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'recovery-test@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

test('recovery link sets the session so a new password can be saved', async ({ page }) => {
  const accessToken = [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({ sub: fakeUser.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }),
    Buffer.from('signature').toString('base64url'),
  ].join('.');

  let sessionVerifiedWithToken = false;
  let passwordUpdateAuthHeader: string | undefined;

  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
  };

  await page.route('**/auth/v1/user', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const authHeader = request.headers()['authorization'];
    if (request.method() === 'GET') {
      sessionVerifiedWithToken = authHeader === `Bearer ${accessToken}`;
    }
    if (request.method() === 'PUT') {
      passwordUpdateAuthHeader = authHeader;
    }
    await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(fakeUser) });
  });

  await page.goto(`/#access_token=${accessToken}&refresh_token=fake-refresh&type=recovery`);

  await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="auth-new-password-input"]')).toBeVisible();
  await expect.poll(() => sessionVerifiedWithToken).toBe(true);

  await page.locator('[data-testid="auth-new-password-input"]').fill('nova-lozinka-123');
  await page.locator('[data-testid="auth-confirm-password-input"]').fill('nova-lozinka-123');
  await page.locator('[data-testid="auth-submit-button"]').click();

  await expect(page.getByText('Lozinka uspješno promijenjena')).toBeVisible();
  expect(passwordUpdateAuthHeader).toBe(`Bearer ${accessToken}`);
});
