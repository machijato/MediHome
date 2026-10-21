import { test, expect } from '@playwright/test';

// Pravne stranice (nacrti): postoje, imaju oznaku nacrta, dostupne su iz podnožja. Bez baze.

const PAGES: Array<{ path: string; title: string; footerTestId?: string }> = [
  { path: '/uvjeti-koristenja', title: 'Opći uvjeti korištenja', footerTestId: 'footer-terms-link' },
  { path: '/politika-privatnosti', title: 'Politika privatnosti', footerTestId: 'footer-privacy-link' },
  { path: '/odricanje-odgovornosti', title: 'Odricanje od odgovornosti', footerTestId: 'footer-disclaimer-link' },
  { path: '/kolacici', title: 'Politika kolačića', footerTestId: 'footer-cookies-link' },
  { path: '/kako-funkcioniraju-recenzije', title: 'Kako funkcioniraju recenzije', footerTestId: 'footer-reviews-info-link' },
  { path: '/prijava-sadrzaja', title: 'Prijava nezakonitog sadržaja', footerTestId: 'footer-report-content-link' },
  { path: '/impressum', title: 'Impressum', footerTestId: 'footer-impressum-link' },
];

for (const page of PAGES) {
  test(`legal page ${page.path} renders with a draft notice and is linked from the footer`, async ({ page: pw }) => {
    await pw.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await pw.goto('/');
    await pw.locator(`[data-testid="${page.footerTestId}"]`).click();
    await expect(pw).toHaveURL(new RegExp(`${page.path}$`));
    await expect(pw.locator('[data-testid="legal-page-title"]')).toHaveText(page.title);
    await expect(pw.locator('[data-testid="legal-draft-banner"]')).toContainText('Nacrt');
    await expect(pw.locator('main')).not.toContainText('info@medihome.hr');
  });
}

test('cookie policy lists what is stored, disclaimer shows emergency numbers, report page has a mailto link', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/kolacici');
  await expect(page.locator('[data-testid="cookie-table"]')).toContainText('auth-token');
  await expect(page.locator('[data-testid="cookie-table"]')).toContainText('notifications-seen');

  await page.goto('/odricanje-odgovornosti');
  await expect(page.locator('[data-testid="emergency-note"]')).toContainText('112');
  await expect(page.locator('[data-testid="emergency-note"]')).toContainText('194');

  await page.goto('/prijava-sadrzaja');
  await expect(page.locator('[data-testid="report-content-mailto"]')).toHaveAttribute('href', /^mailto:.+\?subject=Prijava/);
});

test('impressum shows placeholders for owner data until they are filled in', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/impressum');
  await expect(page.locator('[data-testid="impressum-details"]')).toContainText('dopuniti');
});
