import { test, expect } from '@playwright/test';

test('homepage has correct title and meta description', async ({ page }) => {
  test.setTimeout(15000);
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const title = await page.title();
  expect(title).toContain('MediHome');
  expect(title).not.toBe('My Google AI Studio App');

  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();
});

test('category page loads with correct content', async ({ page }) => {
  test.setTimeout(15000);
  await page.goto('/kategorija/fizioterapeut');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="category-page"]')).toBeVisible({ timeout: 10000 });

  const title = await page.title();
  expect(title).toContain('Fizioterapeuti');
});

test('invalid category shows not found message', async ({ page }) => {
  test.setTimeout(15000);
  await page.goto('/kategorija/nepostojeca-kategorija-xyz');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('text=Kategorija nije pronađena')).toBeVisible({ timeout: 10000 });
});
