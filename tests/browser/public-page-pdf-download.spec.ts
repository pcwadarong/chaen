import { expect, type Page, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

const mockPdfOptions = async (page: Page) => {
  await page.route('**/api/pdf/options/**', async route => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/resume?')) {
      await route.fulfill({
        body: JSON.stringify([
          {
            assetKey: 'resume-ko',
            fileName: 'ParkChaewon-Resume-ko.pdf',
            href: '/api/pdf/file/resume-ko?source=resume-page',
            locale: 'ko',
          },
        ]),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    if (requestUrl.includes('/portfolio?')) {
      await route.fulfill({
        body: JSON.stringify([
          {
            assetKey: 'portfolio-ko',
            fileName: 'ParkChaewon-Portfolio-ko.pdf',
            href: '/api/pdf/file/portfolio-ko?source=project-page',
            locale: 'ko',
          },
        ]),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify([]),
      contentType: 'application/json',
      status: 200,
    });
  });
};

/**
 * 공개 resume route에서는 header action의 PDF 다운로드가 준비되면 실제 다운로드 옵션 팝오버를 열 수 있어야 한다.
 */
test('이력서 공개 페이지는 header PDF 다운로드 액션을 열 수 있어야 한다', async ({ page }) => {
  await mockPdfOptions(page);
  await page.goto('/ko/resume', { waitUntil: 'domcontentloaded' });

  const triggerButton = page.getByRole('button', { name: '다운로드' });

  await expect(triggerButton).toBeEnabled();
  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '다운로드' })).toBeVisible();
  await expect(page.getByRole('link', { name: /KO ParkChaewon-Resume-ko\.pdf/ })).toHaveAttribute(
    'href',
    '/api/pdf/file/resume-ko?source=resume-page',
  );
});

/**
 * 공개 project route에서는 header action의 포트폴리오 다운로드가 준비되면 실제 다운로드 옵션 팝오버를 열 수 있어야 한다.
 */
test('프로젝트 공개 페이지는 header PDF 다운로드 액션을 열 수 있어야 한다', async ({ page }) => {
  await mockPdfOptions(page);
  await page.goto('/ko/project', { waitUntil: 'domcontentloaded' });

  const triggerButton = page.getByRole('button', { name: '포트폴리오 다운로드' });

  await expect(triggerButton).toBeEnabled();
  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '포트폴리오 다운로드' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /KO ParkChaewon-Portfolio-ko\.pdf/ }),
  ).toHaveAttribute('href', '/api/pdf/file/portfolio-ko?source=project-page');
});
