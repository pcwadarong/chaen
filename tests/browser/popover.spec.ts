import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

const FIXTURE_HYDRATION_SETTLE_MS = 2_500;

/**
 * Popover는 열릴 때 첫 번째 옵션으로 포커스를 이동시키고 Escape 닫힘 후 trigger 포커스를 복원해야 한다.
 */
test('팝오버는 첫 포커스와 Escape 닫힘 후 trigger 포커스 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/popover', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(FIXTURE_HYDRATION_SETTLE_MS);

  const fixtureMain = page.getByRole('main');
  const triggerButton = fixtureMain.getByRole('button', { name: '테마 선택' });
  const firstOption = page.getByRole('button', { name: '시스템' });

  await triggerButton.focus();
  await expect(triggerButton).toBeFocused();

  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '테마 선택' })).toBeVisible();
  await expect(firstOption).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog', { name: '테마 선택' })).toHaveCount(0);
  await expect(triggerButton).toBeFocused();
});

/**
 * Popover는 바깥 영역을 클릭하면 닫혀야 한다.
 */
test('팝오버는 outside click으로 닫혀야 한다', async ({ page }) => {
  await page.goto('/ko/test/popover', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(FIXTURE_HYDRATION_SETTLE_MS);

  await page.getByRole('main').getByRole('button', { name: '테마 선택' }).click();
  await expect(page.getByRole('dialog', { name: '테마 선택' })).toBeVisible();

  await page.getByRole('heading', { name: 'Outside Area' }).click();

  await expect(page.getByRole('dialog', { name: '테마 선택' })).toHaveCount(0);
});

/**
 * portaled Popover는 scroll 이후에도 trigger 기준 위치를 다시 계산해야 한다.
 */
test('포털 팝오버는 scroll 이후 trigger 기준 위치 재계산을 반영해야 한다', async ({ page }) => {
  await page.goto('/ko/test/popover', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(FIXTURE_HYDRATION_SETTLE_MS);

  const scrollViewport = page.locator('[data-app-scroll-viewport="true"]');
  const triggerButton = page.getByRole('button', { name: '포털 메뉴 열기' });

  await triggerButton.scrollIntoViewIfNeeded();
  await triggerButton.click();

  const dialog = page.locator('[role="dialog"]').filter({
    has: page.getByRole('button', { name: '포털 항목' }),
  });
  await expect(dialog).toBeVisible();

  const initialDialogBox = await dialog.boundingBox();
  const initialTriggerBox = await triggerButton.boundingBox();

  expect(initialDialogBox).not.toBeNull();
  expect(initialTriggerBox).not.toBeNull();

  await scrollViewport.evaluate((element, delta) => {
    element.scrollBy({
      top: Math.max(Math.round((delta ?? 0) - 80), 0),
      behavior: 'instant',
    });
  }, initialTriggerBox?.y);

  await expect
    .poll(async () => {
      const nextDialogBox = await dialog.boundingBox();
      return Math.round(nextDialogBox?.y ?? -1);
    })
    .not.toBe(Math.round(initialDialogBox?.y ?? -1));

  await expect
    .poll(async () => {
      const nextTriggerBox = await triggerButton.boundingBox();
      return Math.round(nextTriggerBox?.y ?? -1);
    })
    .toBeLessThan(Math.round(initialTriggerBox?.y ?? Number.MAX_SAFE_INTEGER));
});
