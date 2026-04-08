import { expect, test } from '@playwright/test';

/**
 * ImageViewerModal은 실제 keyboard navigation으로 활성 썸네일을 바꾸고 backdrop 닫힘 후 trigger 포커스를 복원해야 한다.
 */
test('이미지 뷰어 모달은 keyboard navigation과 backdrop 닫힘 후 포커스 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/image-viewer-modal');

  const triggerButton = page.getByRole('button', { name: '이미지 뷰어 열기' });
  const firstThumbnail = page.getByRole('button', { name: '첫 번째 이미지 1' });
  const secondThumbnail = page.getByRole('button', { name: '두 번째 이미지 2' });

  await triggerButton.focus();
  await expect(triggerButton).toBeFocused();

  await triggerButton.click();
  await expect(page.getByRole('dialog', { name: '첫 번째 이미지' })).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(secondThumbnail).toHaveAttribute('aria-current', 'true');

  await page.keyboard.press('ArrowLeft');
  await expect(firstThumbnail).toHaveAttribute('aria-current', 'true');

  await page.locator('[data-image-viewer-backdrop="true"]').click({
    position: { x: 8, y: 8 },
  });

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('image-viewer-close-count')).toHaveText('closeCount:1');
  await expect(triggerButton).toBeFocused();
});

/**
 * ImageViewerModal은 열릴 때 첫 포커스를 닫기 버튼으로 보내고, Shift+Tab과 Tab으로 dialog 내부 순환을 유지해야 한다.
 */
test('이미지 뷰어 모달은 닫기 버튼에서 시작해 dialog 내부 포커스 순환을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/image-viewer-modal');

  const triggerButton = page.getByRole('button', { name: '이미지 뷰어 열기' });
  const closeButton = page.getByRole('button', { name: '닫기' });
  const secondThumbnail = page.getByRole('button', { name: '두 번째 이미지 2' });

  await triggerButton.click();

  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(secondThumbnail).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
});
