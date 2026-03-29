import { LAYOUT_WIDTHS } from '@/shared/config/layout';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';

export const BREAKPOINTS = {
  BP1: VIEWPORT_BREAKPOINTS.mobileSmallMax,
  BP2: VIEWPORT_BREAKPOINTS.tabletMax,
  BP3: LAYOUT_WIDTHS.contentWide - 1,
} as const;

/**
 * 씬이 취할 수 있는 viewport 배치 계열입니다.
 * `stacked`는 세로 적층형, `wide`는 가로 확장형 구도를 뜻합니다.
 */
export const SCENE_VIEWPORT_MODE = {
  stacked: 'stacked',
  wide: 'wide',
} as const;

export type SceneViewportMode = (typeof SCENE_VIEWPORT_MODE)[keyof typeof SCENE_VIEWPORT_MODE];

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
 * 현재 viewport 너비가 적층형 씬인지 가로 확장형 씬인지 판별합니다.
 * 네비 모바일 메뉴가 유지되는 tablet 최대 구간까지는 적층형 씬으로 유지합니다.
 */
export const getSceneViewportMode = (width: number): SceneViewportMode =>
  width <= VIEWPORT_BREAKPOINTS.tabletMax ? SCENE_VIEWPORT_MODE.stacked : SCENE_VIEWPORT_MODE.wide;
