import { expect, test } from '@playwright/test';

/**
 * Modal은 초기 포커스를 지정한 입력으로 이동시키고 Tab 순환 및 Escape 닫힘 후 포커스 복원을 유지해야 한다.
 */
test('모달은 초기 포커스와 포커스 순환 및 Escape 닫힘 후 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/modal');

  const triggerButton = page.getByRole('button', { name: '모달 열기' });
  const passwordInput = page.getByLabel('비밀번호');
  const lastButton = page.getByRole('button', { name: '마지막' });

  await triggerButton.focus();
  await triggerButton.press('Enter');

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(passwordInput).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(triggerButton).toBeFocused();

  await triggerButton.focus();
  await triggerButton.press('Space');

  const closeButton = page.getByRole('button', { name: '닫기' });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(passwordInput).toBeFocused();

  await lastButton.focus();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(lastButton).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('modal-close-count')).toHaveText('closeCount:2');
  await expect(triggerButton).toBeFocused();
});
