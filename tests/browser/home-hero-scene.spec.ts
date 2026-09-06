import { expect, type Page, test } from '@playwright/test';

const HOME_HERO_SCENE_FIXTURE_PATH = '/ko/test/home-hero-scene';

test.describe.configure({ mode: 'serial' });

/**
 * 홈 히어로 3D 자산 요청을 짧게 지연시켜 초기 blocking 로딩 오버레이 계약을 안정적으로 드러냅니다.
 */
const delayHomeHeroStageAssets = async (page: Page) => {
  await page.route(/\/(models|textures)\//, async route => {
    await new Promise(resolve => {
      setTimeout(resolve, 250);
    });
    await route.continue();
  });
};

/**
 * 초기 자산 로딩이 남아 있을 때 홈 히어로는 blocking 로딩 오버레이를 유지하고, canvas 준비 뒤 해제해야 한다.
 */
test('초기 자산 로딩 중 홈 히어로는 blocking 로딩 오버레이를 유지하다가 준비 뒤 해제해야 한다', async ({
  page,
}) => {
  await delayHomeHeroStageAssets(page);
  await page.goto(HOME_HERO_SCENE_FIXTURE_PATH, { waitUntil: 'domcontentloaded' });

  const loadingOverlay = page.locator('[role="status"][aria-busy="true"]');
  const canvas = page.locator('#three-canvas');

  await expect(loadingOverlay).toBeVisible();
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await expect(loadingOverlay).toHaveCount(0, { timeout: 30_000 });
});

/**
 * 캔버스가 준비되면 접근성 속성과 contextmenu browser event 결합을 유지해야 한다.
 */
test('홈 히어로 canvas는 접근성 속성과 contextmenu browser event 결합을 유지해야 한다', async ({
  page,
}) => {
  await page.goto(HOME_HERO_SCENE_FIXTURE_PATH, { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('#three-canvas');
  const helpText = page.locator('#scene-interaction-help-text');

  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[role="status"][aria-busy="true"]')).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(helpText).toHaveCount(1);
  // 씬 초기화와 액자 텍스처 업로드가 겹치면 메인 스레드가 수 초간 막혀 poll이 진행되지 못한다.
  // 위 canvas/overlay 단언과 같은 상한을 쓴다 — 검증 대상은 "언제"가 아니라 "속성이 붙는가"다.
  await expect.poll(() => canvas.evaluate(node => node.tabIndex), { timeout: 30_000 }).toBe(0);
  await expect(canvas).toHaveAttribute('aria-label', '홈 씬 상호작용 캔버스');
  await expect
    .poll(() => canvas.evaluate(node => node.getAttribute('aria-describedby') ?? ''), {
      timeout: 30_000,
    })
    .toContain('scene-interaction-help-text');
  expect(
    await canvas.evaluate(node => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      const dispatchResult = node.dispatchEvent(contextMenuEvent);

      return {
        defaultPrevented: contextMenuEvent.defaultPrevented,
        dispatchResult,
      };
    }),
  ).toEqual({
    defaultPrevented: false,
    dispatchResult: true,
  });
});
