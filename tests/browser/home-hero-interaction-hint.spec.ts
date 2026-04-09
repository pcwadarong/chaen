import { expect, test } from '@playwright/test';

const HOME_HERO_INTERACTION_HINT_STORAGE_KEY = 'home-hero:interaction-hint-dismissed';

/**
 * 현재 문서에서 HomeHeroInteractionHint dismissal 흔적을 지워 첫 방문 상태를 맞춥니다.
 */
const clearInteractionHintDismissal = async (page: {
  evaluate: <T>(pageFunction: (storageKey: string) => T, arg: string) => Promise<T>;
}) => {
  await page.evaluate(storageKey => {
    window.localStorage.removeItem(storageKey);
  }, HOME_HERO_INTERACTION_HINT_STORAGE_KEY);
};

/**
 * 첫 방문에서 안내 문구를 닫으면 localStorage에 기록되고, 같은 브라우저 재방문에서도 다시 나타나지 않아야 한다.
 */
test('홈 히어로 안내 문구는 닫힘 후 같은 브라우저 재방문에서 다시 나타나지 않아야 한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ko/test/home-hero-interaction-hint');
  await clearInteractionHintDismissal(page);
  await page.reload();

  const hint = page.getByRole('note', { name: '홈 장면 상호작용 안내' });

  await expect(hint).toBeVisible();
  await expect(hint).toContainText('스크롤을 내리거나 기타, 카메라를 눌러보세요');

  await page.getByRole('button', { name: '닫기' }).click();

  await expect(hint).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        storageKey => window.localStorage.getItem(storageKey),
        HOME_HERO_INTERACTION_HINT_STORAGE_KEY,
      ),
    )
    .toBe('true');

  await page.reload();

  await expect(hint).toHaveCount(0);
});

/**
 * 홈 히어로 scroll viewport가 top 임계값을 넘기면 안내 문구는 자동으로 사라져야 한다.
 */
test('홈 히어로 안내 문구는 scroll viewport가 top 임계값을 넘기면 자동으로 사라져야 한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ko/test/home-hero-interaction-hint');
  await clearInteractionHintDismissal(page);
  await page.reload();

  const hint = page.getByRole('note', { name: '홈 장면 상호작용 안내' });
  const viewport = page.locator('[data-app-scroll-viewport="true"]').first();

  await expect(hint).toBeVisible();

  await viewport.hover();
  await page.mouse.wheel(0, 80);

  await expect(hint).toHaveCount(0);
});
