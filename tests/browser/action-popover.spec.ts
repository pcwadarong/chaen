import { expect, test } from '@playwright/test';

/**
 * ActionPopover는 trigger와 dialog를 연결하고 Escape 닫힘 후 trigger 포커스를 복원해야 한다.
 */
test('액션 팝오버는 trigger-dialog 연결과 Escape 닫힘 후 포커스 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/action-popover');

  const fixtureMain = page.getByRole('main');
  const triggerButton = fixtureMain.getByRole('button', { name: '메뉴 열기' });

  await triggerButton.focus();
  await expect(triggerButton).toBeFocused();

  await triggerButton.click();

  const dialog = page.getByRole('dialog', { name: '액션 메뉴' });
  await expect(dialog).toBeVisible();
  await expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
  await expect(triggerButton).toHaveAttribute('aria-controls', await dialog.getAttribute('id'));

  await page.keyboard.press('Escape');

  await expect(dialog).toHaveCount(0);
  await expect(triggerButton).toBeFocused();
});

/**
 * ActionPopover는 바깥 영역 클릭으로 닫혀야 한다.
 */
test('액션 팝오버는 outside click으로 닫혀야 한다', async ({ page }) => {
  await page.goto('/ko/test/action-popover');

  const fixtureMain = page.getByRole('main');
  await fixtureMain.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('dialog', { name: '액션 메뉴' })).toBeVisible();

  await page.getByRole('heading', { name: 'Outside Area' }).click();

  await expect(page.getByRole('dialog', { name: '액션 메뉴' })).toHaveCount(0);
});
