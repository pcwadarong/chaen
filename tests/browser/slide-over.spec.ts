import { expect, test } from '@playwright/test';

/**
 * SlideOver는 초기 포커스를 지정한 입력으로 이동시키고 포커스 순환 및 Escape 닫힘 후 trigger 복원을 유지해야 한다.
 */
test('슬라이드오버는 초기 포커스와 포커스 순환 및 Escape 닫힘 후 복원을 유지해야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/slide-over');

  const fixtureMain = page.getByRole('main');
  const triggerButton = fixtureMain.getByRole('button', { name: '패널 열기' });
  const input = page.getByLabel('검색어');
  const lastButton = page.getByRole('button', { name: '마지막 액션' });

  await triggerButton.focus();
  await expect(triggerButton).toBeFocused();

  await triggerButton.click();

  await expect(page.getByRole('dialog', { name: '테스트 패널' })).toBeVisible();
  await expect(input).toBeFocused();

  await lastButton.focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(lastButton).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(page.locator('[data-slide-over-panel="true"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(triggerButton).toBeFocused();
});

/**
 * SlideOver는 backdrop 클릭으로 닫히고 exit animation이 끝나면 DOM에서 제거되어야 한다.
 */
test('슬라이드오버는 backdrop 클릭 후 exit animation이 끝나면 DOM에서 제거되어야 한다', async ({
  page,
}) => {
  await page.goto('/ko/test/slide-over');

  await page.getByRole('main').getByRole('button', { name: '패널 열기' }).click();
  await expect(page.locator('[data-slide-over-panel="true"]')).toBeVisible();

  await page.locator('[data-slide-over-backdrop="true"]').click({
    position: { x: 8, y: 8 },
  });

  // exit state에서는 접근성 트리에서 먼저 숨기고,
  // 이후 timeout 안에 애니메이션이 끝나면 DOM에서 제거되어야 합니다.
  await expect(page.locator('[data-slide-over-panel="true"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.locator('[data-slide-over-panel="true"]')).toHaveCount(0, { timeout: 2000 });
});
