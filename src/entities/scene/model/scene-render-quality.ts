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
}>;

type GetContactSceneRenderQualityParams = Readonly<{
  viewportWidth: number;
}>;

const STACKED_SCENE_DPR_RANGE: DprRange = [1, 1.25];
const FULL_WIDE_SCENE_DPR_RANGE: DprRange = [1, 2];
const CONTACT_SCENE_COMPACT_DPR_RANGE: DprRange = [1, 1.35];
const CONTACT_SCENE_FULL_DPR_RANGE: DprRange = [1, 1.5];

/**
 * 홈 히어로 씬의 viewport 성격에 맞는 렌더 품질 프리셋을 계산합니다.
 * 홈은 stacked와 wide 두 계열만 유지하고, quality도 같은 기준으로 나눕니다.
 * 극단적으로 세로가 짧은 wide 화면은 contact 쪽 compact 분기에서만 별도 처리합니다.
 */
export const getHomeHeroSceneRenderQuality = ({
  sceneViewportMode,
}: GetHomeHeroSceneRenderQualityParams): SceneRenderQuality => {
  if (sceneViewportMode === SCENE_VIEWPORT_MODE.stacked) {
    return {
      dpr: STACKED_SCENE_DPR_RANGE,
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
