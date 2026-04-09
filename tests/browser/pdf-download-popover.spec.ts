import { expect, test } from '@playwright/test';

/**
 * DeferredPdfDownloadPopover는 옵션 조회가 완료되면 다운로드 가능한 링크와 비활성 옵션을 함께 노출해야 한다.
 */
test('PDF 다운로드 팝오버는 옵션 조회 후 다운로드 링크와 비활성 옵션을 함께 노출해야 한다', async ({
  page,
}) => {
  await page.route('**/api/pdf/options/**', async route => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/resume?')) {
      await new Promise(resolve => {
        setTimeout(resolve, 300);
      });

      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify([
          {
            assetKey: 'resume-ko',
            fileName: 'ParkChaewon-Resume-ko.pdf',
            href: '/api/pdf/file/resume-ko?source=resume-page',
            locale: 'ko',
          },
          {
            assetKey: 'resume-en',
            fileName: 'ParkChaewon-Resume-en.pdf',
            href: null,
            locale: 'en',
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify([]),
    });
  });

  await page.goto('/ko/test/pdf-download-popover');

  const resumeSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Resume Download' }),
  });
  const resumeTrigger = resumeSection.getByRole('button', { name: '이력서 다운로드' });

  await expect(resumeTrigger).toBeDisabled();
  await expect(resumeTrigger).toBeEnabled();

  await resumeTrigger.click();

  const dialog = page.getByRole('dialog', { name: '이력서 다운로드' });
  const koLink = page.getByRole('link', { name: /KO ParkChaewon-Resume-ko\.pdf/ });
  const enButton = page.getByRole('button', { name: /EN ParkChaewon-Resume-en\.pdf/ });

  await expect(dialog).toBeVisible();
  await expect(koLink).toHaveAttribute('href', '/api/pdf/file/resume-ko?source=resume-page');
  await expect(koLink).toHaveAttribute('download', 'ParkChaewon-Resume-ko.pdf');
  await expect(enButton).toBeDisabled();
});

/**
 * DeferredPdfDownloadPopover는 옵션 조회가 실패하면 unavailable 버튼으로 폴백해야 한다.
 */
test('PDF 다운로드 팝오버는 옵션 조회가 실패하면 unavailable 버튼으로 폴백해야 한다', async ({
  page,
}) => {
  await page.route('**/api/pdf/options/**', async route => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/portfolio?')) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'failed' }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify([
        {
          assetKey: 'resume-ko',
          fileName: 'ParkChaewon-Resume-ko.pdf',
          href: '/api/pdf/file/resume-ko?source=resume-page',
          locale: 'ko',
        },
      ]),
    });
  });

  await page.goto('/ko/test/pdf-download-popover');

  const portfolioSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Portfolio Download' }),
  });

  await expect(portfolioSection.getByRole('button', { name: '포트폴리오 준비 중' })).toBeDisabled();
});
