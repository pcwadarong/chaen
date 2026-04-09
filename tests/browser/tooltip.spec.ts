import { expect, test } from '@playwright/test';

/**
 * Tooltip은 focus 시 열리고 aria-describedby로 연결되며, blur 후에는 닫혀야 한다.
 */
test('툴팁은 focus와 blur에 따라 aria-describedby 연결과 닫힘을 반영해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/tooltip');

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
  await page.goto('/ko/test/tooltip');

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
  await page.goto('/ko/test/tooltip');

  const triggerButton = page.getByRole('main').getByRole('button', { name: '축소 버튼' });
  const tooltip = page.getByRole('tooltip', { name: '이미지 축소' });

  await triggerButton.focus();
  await expect(tooltip).toHaveCount(0);

  await triggerButton.hover();
  await expect(tooltip).toBeVisible();

  await page.getByRole('main').getByRole('button', { name: '바깥 포커스 이동' }).hover();
  await expect(tooltip).toHaveCount(0);
});
