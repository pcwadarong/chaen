import { expect, test } from '@playwright/test';

/**
 * ActionPopover는 trigger와 dialog를 연결하고 Escape 닫힘 후 trigger 포커스를 복원해야 한다.
 */
test('액션 팝오버가 열리고 Escape로 닫히면, ActionPopover는 trigger-dialog 연결과 포커스 복원을 유지해야 한다', async ({
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
  const dialogId = await dialog.getAttribute('id');

  expect(dialogId).not.toBeNull();
  await expect(triggerButton).toHaveAttribute('aria-controls', dialogId ?? '');

  await page.keyboard.press('Escape');

  await expect(dialog).toHaveCount(0);
  await expect(triggerButton).toBeFocused();
});

/**
 * ActionPopover는 바깥 영역 클릭으로 닫혀야 한다.
 */
test('바깥 영역을 클릭하면, ActionPopover는 outside interaction으로 닫혀야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/action-popover');

  const fixtureMain = page.getByRole('main');
  await fixtureMain.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('dialog', { name: '액션 메뉴' })).toBeVisible();

  await page.getByRole('heading', { name: 'Outside Area' }).click();

  await expect(page.getByRole('dialog', { name: '액션 메뉴' })).toHaveCount(0);
});
