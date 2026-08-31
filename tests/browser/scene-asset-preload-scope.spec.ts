import { expect, type Page, test } from '@playwright/test';

const GLB_REQUEST_PATTERN = /\.glb(\?|$)/;
const EXTERNAL_DECODER_CDN_PATTERN = /gstatic\.com/;

/**
 * 페이지가 살아 있는 동안 나간 GLB / 외부 디코더 CDN 요청 URL을 수집합니다.
 *
 * @param page 요청을 감시할 Playwright 페이지입니다.
 * @returns 수집된 URL 배열을 담은 레코드입니다.
 */
const collectAssetRequests = (page: Page) => {
  const glbRequests: string[] = [];
  const externalCdnRequests: string[] = [];

  page.on('request', request => {
    const url = request.url();

    if (GLB_REQUEST_PATTERN.test(url)) glbRequests.push(url);
    if (EXTERNAL_DECODER_CDN_PATTERN.test(url)) externalCdnRequests.push(url);
  });

  return { externalCdnRequests, glbRequests };
};

test.describe('3D 자산 프리로드 범위', () => {
  for (const path of ['/ko/articles', '/ko/resume']) {
    test(`3D를 렌더하지 않는 ${path} 진입 시 GLB 요청이 하나도 나가지 않아야 한다`, async ({
      page,
    }) => {
      const { glbRequests } = collectAssetRequests(page);

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      expect(glbRequests).toEqual([]);
    });
  }

  test('홈 진입 시 씬 GLB 4개를 모두 받고 외부 디코더 CDN은 때리지 않아야 한다', async ({
    page,
  }) => {
    const { externalCdnRequests, glbRequests } = collectAssetRequests(page);

    await page.goto('/ko');
    await expect(page.locator('#scene-scroll-container')).toBeVisible();
    await expect.poll(() => new Set(glbRequests).size, { timeout: 30_000 }).toBe(4);

    expect(externalCdnRequests).toEqual([]);
  });

  test('비3D 라우트에서 홈으로 클라이언트 네비게이션할 때도 씬 GLB 프리로드가 시작되어야 한다', async ({
    page,
  }) => {
    const { glbRequests } = collectAssetRequests(page);

    await page.goto('/ko/resume');
    await page.waitForLoadState('networkidle');
    expect(glbRequests).toEqual([]);

    await page.getByRole('link', { exact: true, name: '홈' }).first().click();

    await expect(page).toHaveURL(/\/ko$/);
    await expect.poll(() => new Set(glbRequests).size, { timeout: 30_000 }).toBe(4);
  });
});
