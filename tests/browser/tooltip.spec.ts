import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

/**
 * Tooltip은 focus 시 열리고 aria-describedby로 연결되며, blur 후에는 닫혀야 한다.
 */
test('툴팁은 focus와 blur에 따라 aria-describedby 연결과 닫힘을 반영해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/tooltip', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-hydrated="true"]').waitFor();

  const fixtureMain = page.getByRole('main');
  const triggerButton = fixtureMain.getByRole('button', { name: '굵게 버튼' });
  const outsideButton = fixtureMain.getByRole('button', { name: '바깥 포커스 이동' });
  const tooltip = page.getByRole('tooltip', { name: '굵게' });

  await triggerButton.focus();
  await expect(tooltip).toBeVisible();

  const describedBy = await triggerButton.getAttribute('aria-describedby');
  const tooltipId = await tooltip.getAttribute('id');

  expect(describedBy).toBe(tooltipId);
  await expect
    .poll(() => tooltip.evaluate(element => element.parentElement === document.body))
    .toBe(true);

  await outsideButton.focus();
  await expect(tooltip).toHaveCount(0);
});

/**
 * Tooltip은 hover와 focus 중 하나라도 유지되면 계속 열려 있어야 하고, 둘 다 사라지면 닫혀야 한다.
 */
test('툴팁은 hover와 focus 중 하나라도 유지되면 계속 열려 있어야 한다', async ({ page }) => {
  await page.goto('/ko/test/tooltip', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-hydrated="true"]').waitFor();

  const triggerButton = page.getByRole('main').getByRole('button', { name: '정렬 버튼' });
  const outsideButton = page.getByRole('main').getByRole('button', { name: '바깥 포커스 이동' });
  const tooltip = page.getByRole('tooltip', { name: '정렬' });

  await triggerButton.hover();
  await expect(tooltip).toBeVisible();

  await triggerButton.focus();
  await outsideButton.hover();
  await expect(tooltip).toBeVisible();

  await outsideButton.focus();
  await expect(tooltip).toHaveCount(0);
});

/**
 * openOnFocus가 false인 Tooltip은 focus만으로는 열리지 않고, hover에서만 열렸다가 mouse leave 시 닫혀야 한다.
 */
test('openOnFocus가 false인 툴팁은 hover에서만 열리고 mouse leave 시 닫혀야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/tooltip', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-hydrated="true"]').waitFor();

  const triggerButton = page.getByRole('main').getByRole('button', { name: '축소 버튼' });
  const tooltip = page.getByRole('tooltip', { name: '이미지 축소' });

  await triggerButton.focus();
  await expect(tooltip).toHaveCount(0);

  await triggerButton.hover();
  await expect(tooltip).toBeVisible();

  await page.getByRole('main').getByRole('button', { name: '바깥 포커스 이동' }).hover();
  await expect(tooltip).toHaveCount(0);
});

/**
 * Tooltip은 auto placement와 scroll/resize 이후에도 트리거 기준 위치를 다시 계산해야 한다.
 */
test('툴팁은 auto placement와 scroll 이후 위치 재계산을 반영해야 한다', async ({ page }) => {
  await page.goto('/ko/test/tooltip', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-hydrated="true"]').waitFor();

  const scrollViewport = page.locator('[data-app-scroll-viewport="true"]');
  const triggerButton = page.getByRole('main').getByRole('button', { name: '자동 배치 버튼' });
  const tooltip = page.getByRole('tooltip', { name: '자동 배치' });

  await triggerButton.scrollIntoViewIfNeeded();
  await triggerButton.focus();
  await expect(tooltip).toBeVisible();

  const initialTriggerBox = await triggerButton.boundingBox();
  const initialTooltipBox = await tooltip.boundingBox();

  expect(initialTriggerBox).not.toBeNull();
  expect(initialTooltipBox).not.toBeNull();
  expect((initialTooltipBox?.y ?? 0) < (initialTriggerBox?.y ?? 0)).toBe(true);

  await scrollViewport.evaluate((element, delta) => {
    element.scrollBy({
      top: Math.max(Math.round((delta ?? 0) - 24), 0),
      behavior: 'instant',
    });
  }, initialTriggerBox?.y);

  await expect
    .poll(async () => Math.round((await triggerButton.boundingBox())?.y ?? -1))
    .toBeLessThanOrEqual(40);

  await expect
    .poll(async () => {
      const nextTooltipBox = await tooltip.boundingBox();
      return Math.round(nextTooltipBox?.y ?? -1);
    })
    .not.toBe(Math.round(initialTooltipBox?.y ?? -1));

  await expect
    .poll(async () => {
      const nextTriggerBox = await triggerButton.boundingBox();
      const nextTooltipBox = await tooltip.boundingBox();
      return (nextTooltipBox?.y ?? -1) >= (nextTriggerBox?.y ?? Number.MAX_SAFE_INTEGER);
    })
    .toBe(true);
});
