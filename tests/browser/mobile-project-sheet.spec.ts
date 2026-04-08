import { expect, test } from '@playwright/test';

/**
 * 모바일 프로젝트 시트는 열릴 때 dialog로 포커스를 가져오고, Tab 순환과 닫힘 후 복귀를 유지해야 한다.
 */
test('모바일 프로젝트 시트 dialog는 포커스 순환과 닫힘 후 복귀를 유지해야 한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ko/test/mobile-project-sheet');

  const triggerButton = page.getByRole('button', { name: '프로젝트 패널 열기' });
  const dialog = page.getByRole('dialog', { name: '모바일 프로젝트 패널' });
  const closeButton = page.getByRole('button', { name: '내리기' });
  const projectLink = page.getByRole('link', { name: '테스트 프로젝트 상세 보기' });

  await triggerButton.focus();
  await expect(triggerButton).toBeFocused();

  await triggerButton.click();

  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(projectLink).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(projectLink).toBeFocused();

  await closeButton.click();

  await expect(dialog).toBeHidden();
  await expect(triggerButton).toBeFocused();
});
