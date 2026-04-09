import { expect, test } from '@playwright/test';

/**
 * Popover는 열릴 때 첫 번째 옵션으로 포커스를 이동시키고 Escape 닫힘 후 trigger 포커스를 복원해야 한다.
 */
test('팝오버는 첫 포커스와 Escape 닫힘 후 trigger 포커스 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/popover');

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
  await page.goto('/ko/test/popover');

  await page.getByRole('main').getByRole('button', { name: '테마 선택' }).click();
  await expect(page.getByRole('dialog', { name: '테마 선택' })).toBeVisible();

  await page.getByRole('heading', { name: 'Outside Area' }).click();

  await expect(page.getByRole('dialog', { name: '테마 선택' })).toHaveCount(0);
});
