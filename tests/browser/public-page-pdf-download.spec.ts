import { expect, test } from '@playwright/test';

/**
 * ResumePage fixture에서는 header action의 PDF 다운로드가 준비되면 실제 다운로드 옵션 팝오버를 열 수 있어야 한다.
 */
test('이력서 페이지 fixture는 header PDF 다운로드 액션을 열 수 있어야 한다', async ({ page }) => {
  await page.route('**/api/pdf/options/**', async route => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/resume?')) {
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
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify([]),
    });
  });

  await page.goto('/ko/test/resume-download-page');

  const triggerButton = page.getByRole('button', { name: '이력서 다운로드' });

  await expect(triggerButton).toBeDisabled();
  await expect(triggerButton).toBeEnabled();
  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '이력서 다운로드' })).toBeVisible();
  await expect(page.getByRole('link', { name: /KO ParkChaewon-Resume-ko\.pdf/ })).toHaveAttribute(
    'href',
    '/api/pdf/file/resume-ko?source=resume-page',
  );
});

/**
 * ProjectListPage fixture에서는 header action의 포트폴리오 다운로드가 준비되면 실제 다운로드 옵션 팝오버를 열 수 있어야 한다.
 */
test('프로젝트 페이지 fixture는 header PDF 다운로드 액션을 열 수 있어야 한다', async ({ page }) => {
  await page.route('**/api/pdf/options/**', async route => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/portfolio?')) {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify([
          {
            assetKey: 'portfolio-ko',
            fileName: 'ParkChaewon-Portfolio-ko.pdf',
            href: '/api/pdf/file/portfolio-ko?source=project-page',
            locale: 'ko',
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

  await page.goto('/ko/test/project-download-page');

  const triggerButton = page.getByRole('button', { name: '포트폴리오 다운로드' });

  await expect(triggerButton).toBeDisabled();
  await expect(triggerButton).toBeEnabled();
  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '포트폴리오 다운로드' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /KO ParkChaewon-Portfolio-ko\.pdf/ }),
  ).toHaveAttribute('href', '/api/pdf/file/portfolio-ko?source=project-page');
});
