export const HOME_HERO_NAV_LOCK_EVENT = 'home-hero-nav-lock-change';

export type HomeHeroNavLockDetail = Readonly<{
  locked: boolean;
}>;

/**
 * 홈 히어로 구간에서 전역 네비게이션 숨김을 잠글 때 사용할 CustomEvent를 생성합니다.
 */
export const createHomeHeroNavLockEvent = (locked: boolean) =>
  new CustomEvent<HomeHeroNavLockDetail>(HOME_HERO_NAV_LOCK_EVENT, {
    detail: { locked },
  });
