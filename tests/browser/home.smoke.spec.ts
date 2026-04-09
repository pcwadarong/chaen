import { expect, test } from '@playwright/test';

/**
 * 루트 진입 시 기본 locale 홈으로 리다이렉트되고 홈 히어로 셸이 표시되는지 확인합니다.
 */
test('루트 진입 시 기본 locale 홈과 hero scene shell이 보여야 한다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('#scene-scroll-container')).toBeVisible();
  await expect(page.getByTestId('home-hero-nav-lock-sentinel')).toBeVisible();
});
