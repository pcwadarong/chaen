import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';

export const BREAKPOINTS = {
  BP1: VIEWPORT_BREAKPOINTS.mobileSmallMax,
  BP2: VIEWPORT_BREAKPOINTS.mobileLargeMax,
  BP3: VIEWPORT_BREAKPOINTS.tabletMax,
  BP4: VIEWPORT_BREAKPOINTS.desktopMax,
} as const;

export type SceneMode = 'mobile' | 'desktop';

export type SceneBreakpoint = 1 | 2 | 3 | 4 | 5;

/**
 * 현재 viewport 너비를 홈 씬용 breakpoint 번호로 변환합니다.
 */
export const getSceneBreakpoint = (width: number): SceneBreakpoint => {
  if (width <= BREAKPOINTS.BP1) return 1;
  if (width <= BREAKPOINTS.BP2) return 2;
  if (width <= BREAKPOINTS.BP3) return 3;
  if (width <= BREAKPOINTS.BP4) return 4;

  return 5;
};

/**
 * 현재 viewport 너비가 모바일 계열 씬인지 데스크탑 계열 씬인지 판별합니다.
 * tablet 구간까지는 모바일 씬으로 취급하고, desktop부터 데스크탑 씬으로 전환합니다.
 */
export const getSceneMode = (width: number): SceneMode =>
  width < VIEWPORT_BREAKPOINTS.desktopMin ? 'mobile' : 'desktop';
