import {
  BREAKPOINTS,
  type SceneBreakpoint,
  type SceneMode,
} from '@/entities/scene/model/breakpointConfig';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';

type HomeHeroViewportSize = Readonly<{
  height: number;
  width: number;
}>;

type HomeHeroBreakpointState = Readonly<{
  currentBP: SceneBreakpoint;
  sceneMode: SceneMode;
}>;

/**
 * 홈 히어로 씬이 데스크톱 구도로 전환되기 시작하는 최소 화면 비율입니다.
 * 가로가 세로보다 충분히 넓을 때만 데스크톱 구도로 보고, 나머지는 모바일 구도로 유지합니다.
 */
const HOME_HERO_DESKTOP_ASPECT_RATIO = 1.15;

/**
 * 홈 히어로 씬에서 사용할 viewport 비율을 계산합니다.
 */
const getViewportAspectRatio = ({ height, width }: HomeHeroViewportSize) =>
  Math.max(width, 0) / Math.max(height, 1);

/**
 * 홈 히어로 씬 전용 scene mode를 계산합니다.
 * 다른 페이지와 달리 가로 폭보다 "피사체가 온전히 들어오는 비율"을 우선합니다.
 */
export const getHomeHeroSceneMode = (viewportSize: HomeHeroViewportSize): SceneMode =>
  getViewportAspectRatio(viewportSize) >= HOME_HERO_DESKTOP_ASPECT_RATIO ? 'desktop' : 'mobile';

/**
 * 홈 히어로 씬 전용 breakpoint 상태를 계산합니다.
 * mode는 비율로 정하고, mode 내부의 세부 프리셋만 width로 나눕니다.
 */
export const getHomeHeroBreakpointState = (
  viewportSize: HomeHeroViewportSize,
): HomeHeroBreakpointState => {
  const safeWidth = Math.max(viewportSize.width, 0);
  const sceneMode = getHomeHeroSceneMode(viewportSize);

  if (sceneMode === 'mobile') {
    return {
      currentBP: safeWidth <= VIEWPORT_BREAKPOINTS.mobileSmallMax ? 1 : 2,
      sceneMode,
    };
  }

  return {
    currentBP: safeWidth <= BREAKPOINTS.BP3 ? 3 : 4,
    sceneMode,
  };
};
