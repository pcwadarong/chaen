import {
  SCENE_VIEWPORT_MODE,
  type SceneViewportMode,
} from '@/entities/scene/model/breakpointConfig';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';

type DprRange = [number, number];

export type SceneRenderQuality = Readonly<{
  dpr: DprRange;
  enableOutlineComposer: boolean;
  shadows: boolean;
}>;

type GetHomeHeroSceneRenderQualityParams = Readonly<{
  sceneViewportMode: SceneViewportMode;
  viewportWidth: number;
}>;

type GetContactSceneRenderQualityParams = Readonly<{
  viewportWidth: number;
}>;

const STACKED_SCENE_DPR_RANGE: DprRange = [1, 1.25];
const NARROW_WIDE_SCENE_DPR_RANGE: DprRange = [1, 1.5];
const FULL_WIDE_SCENE_DPR_RANGE: DprRange = [1, 2];
const CONTACT_SCENE_COMPACT_DPR_RANGE: DprRange = [1, 1.35];
const CONTACT_SCENE_FULL_DPR_RANGE: DprRange = [1, 1.5];

/**
 * 홈 히어로의 wide 구도 중에서도 실제 폭이 desktop 최소값보다 좁은 구간인지 판별합니다.
 * 이 구간은 카메라 배치는 wide를 유지하지만, UX는 bottom sheet 중심이라 풀 데스크탑 품질이 불필요합니다.
 */
const isNarrowWideViewport = ({
  sceneViewportMode,
  viewportWidth,
}: GetHomeHeroSceneRenderQualityParams) =>
  sceneViewportMode === SCENE_VIEWPORT_MODE.wide && viewportWidth < VIEWPORT_BREAKPOINTS.desktopMin;

/**
 * 홈 히어로 씬의 viewport 성격에 맞는 렌더 품질 프리셋을 계산합니다.
 * stacked와 narrow-wide는 mobile 계열 UX를 따르므로 DPR, shadow, outline composer 비용을 낮춥니다.
 */
export const getHomeHeroSceneRenderQuality = ({
  sceneViewportMode,
  viewportWidth,
}: GetHomeHeroSceneRenderQualityParams): SceneRenderQuality => {
  if (sceneViewportMode === SCENE_VIEWPORT_MODE.stacked) {
    return {
      dpr: STACKED_SCENE_DPR_RANGE,
      enableOutlineComposer: false,
      shadows: false,
    };
  }

  if (isNarrowWideViewport({ sceneViewportMode, viewportWidth })) {
    return {
      dpr: NARROW_WIDE_SCENE_DPR_RANGE,
      enableOutlineComposer: false,
      shadows: false,
    };
  }

  return {
    dpr: FULL_WIDE_SCENE_DPR_RANGE,
    enableOutlineComposer: true,
    shadows: true,
  };
};

/**
 * contact 장면은 정적 보강 씬이므로 홈 히어로보다 보수적인 DPR 상한을 사용합니다.
 * 폭이 아주 넓지 않은 desktop에서는 1.35까지, 그 이상에서는 1.5까지 허용해 비용을 낮춥니다.
 */
export const getContactSceneRenderQuality = ({
  viewportWidth,
}: GetContactSceneRenderQualityParams): SceneRenderQuality => ({
  dpr:
    viewportWidth < VIEWPORT_BREAKPOINTS.desktopMax
      ? CONTACT_SCENE_COMPACT_DPR_RANGE
      : CONTACT_SCENE_FULL_DPR_RANGE,
  enableOutlineComposer: false,
  shadows: true,
});
