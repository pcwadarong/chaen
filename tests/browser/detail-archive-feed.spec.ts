import { expect, test } from '@playwright/test';

/**
 * 스크롤 의도가 생기기 전에는 DetailArchiveFeed auto-load가 실행되지 않아야 한다.
 */
test('사용자가 스크롤 의도를 만든 뒤 sentinel이 교차하면, detail archive auto-load는 추가 로드를 실행해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/detail-archive');

  const viewport = page.locator('[data-scroll-region="true"]').first();
  const archiveLinks = viewport.locator('a');
  const loadCount = page.getByTestId('archive-load-count');

  await expect(viewport).toBeVisible();
  await expect(archiveLinks).toHaveCount(8);
  await expect(loadCount).toHaveText('loadCount:0');

  await viewport.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });

  await page.waitForTimeout(200);
  await expect(loadCount).toHaveText('loadCount:0');
  await expect(archiveLinks).toHaveCount(8);

  await page.keyboard.press('PageDown');

  await viewport.evaluate(element => {
    element.scrollTop = 0;
  });

  await viewport.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });

  await expect(loadCount).toHaveText('loadCount:1');
  await expect(archiveLinks).toHaveCount(10);
});
