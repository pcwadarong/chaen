import { LAYOUT_WIDTHS } from '@/shared/config/layout';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';

export const BREAKPOINTS = {
  BP1: VIEWPORT_BREAKPOINTS.mobileSmallMax,
  BP2: VIEWPORT_BREAKPOINTS.tabletMax,
  BP3: LAYOUT_WIDTHS.contentWide - 1,
} as const;

export type SceneMode = 'mobile' | 'desktop';

export type SceneBreakpoint = 1 | 2 | 3 | 4;

/**
 * 현재 viewport 너비를 홈 씬용 breakpoint 번호로 변환합니다.
 */
export const getSceneBreakpoint = (width: number): SceneBreakpoint => {
  if (width <= BREAKPOINTS.BP1) return 1;
  if (width <= BREAKPOINTS.BP2) return 2;
  if (width <= BREAKPOINTS.BP3) return 3;

  return 4;
};

/**
 * 현재 viewport 너비가 모바일 계열 씬인지 데스크탑 계열 씬인지 판별합니다.
 * 네비 모바일 메뉴가 유지되는 tablet 최대 구간까지는 모바일 씬으로 유지합니다.
 */
export const getSceneMode = (width: number): SceneMode =>
  width <= VIEWPORT_BREAKPOINTS.tabletMax ? 'mobile' : 'desktop';
