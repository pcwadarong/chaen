import {
  SCENE_VIEWPORT_MODE,
  type SceneViewportMode,
} from '@/entities/scene/model/breakpointConfig';
import {
  getHomeHeroSceneRenderQuality,
  type SceneRenderQuality,
} from '@/entities/scene/model/scene-render-quality';

type ResolveHomeHeroStageCanvasRuntimeParams = Readonly<{
  interactionDisabledProgressThreshold: number;
  isSequenceActive: boolean;
  progress: number;
  sceneViewportMode: SceneViewportMode;
}>;

export type HomeHeroStageCanvasRuntime = Readonly<{
  areOrbitControlsEnabled: boolean;
  isInteractionEnabled: boolean;
  renderQuality: SceneRenderQuality;
  shouldEnableOrbitZoom: boolean;
}>;

/**
 * 홈 히어로 canvas가 viewport와 transition 상태에 따라 어떤 런타임 프리셋을 써야 하는지 계산합니다.
 * render quality, OrbitControls 잠금 여부, interaction 활성 조건을 한 곳에서 정리해 view는 wiring만 맡도록 합니다.
 */
export const resolveHomeHeroStageCanvasRuntime = ({
  interactionDisabledProgressThreshold,
  isSequenceActive,
  progress,
  sceneViewportMode,
}: ResolveHomeHeroStageCanvasRuntimeParams): HomeHeroStageCanvasRuntime => ({
  areOrbitControlsEnabled: sceneViewportMode === SCENE_VIEWPORT_MODE.stacked || !isSequenceActive,
  isInteractionEnabled: progress < interactionDisabledProgressThreshold,
  renderQuality: getHomeHeroSceneRenderQuality({
    sceneViewportMode,
  }),
  shouldEnableOrbitZoom: sceneViewportMode === SCENE_VIEWPORT_MODE.stacked,
});
