import { expect, test } from '@playwright/test';

/**
 * 데스크톱 app-frame 내부 스크롤에서 global nav는 아래 스크롤에 숨고 위 스크롤에 다시 나타나야 한다.
 */
test('global nav는 app-frame 내부 스크롤 방향에 따라 숨김과 표시를 전환해야 한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/ko/test/global-nav-scroll');

  const header = page.locator('header').first();
  const scrollViewport = page.locator('[data-app-scroll-viewport="true"]').first();

  await expect(header).toBeVisible();
  await expect(scrollViewport).toBeVisible();

  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).opacity))
    .toBe('1');
  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).transform))
    .toBe('matrix(1, 0, 0, 1, 0, 0)');

  await scrollViewport.hover();
  await page.mouse.wheel(0, 720);

  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).opacity))
    .toBe('0');
  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).transform))
    .not.toBe('matrix(1, 0, 0, 1, 0, 0)');

  await page.mouse.wheel(0, -720);

  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).opacity))
    .toBe('1');
  await expect
    .poll(async () => header.evaluate(element => window.getComputedStyle(element).transform))
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
});
