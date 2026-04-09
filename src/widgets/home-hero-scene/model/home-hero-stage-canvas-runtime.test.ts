/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';

import { SCENE_VIEWPORT_MODE } from '@/entities/scene/model/breakpointConfig';
import { resolveHomeHeroStageCanvasRuntime } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-runtime';

describe('resolveHomeHeroStageCanvasRuntime', () => {
  it('stacked viewport에서는 낮은 DPR, 그림자 비활성, OrbitControls 줌 활성 preset을 반환해야 한다', () => {
    const runtime = resolveHomeHeroStageCanvasRuntime({
      interactionDisabledProgressThreshold: 0.5,
      isSequenceActive: false,
      progress: 0,
      sceneViewportMode: SCENE_VIEWPORT_MODE.stacked,
    });

    expect(runtime.renderQuality).toEqual({
      dpr: [1, 1.25],
      enableOutlineComposer: false,
      shadows: false,
    });
    expect(runtime.shouldEnableOrbitZoom).toBe(true);
    expect(runtime.areOrbitControlsEnabled).toBe(true);
  });

  it('wide viewport에서는 full wide 품질과 outline preset을 유지해야 한다', () => {
    const runtime = resolveHomeHeroStageCanvasRuntime({
      interactionDisabledProgressThreshold: 0.5,
      isSequenceActive: false,
      progress: 0,
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
    });

    expect(runtime.renderQuality).toEqual({
      dpr: [1, 2],
      enableOutlineComposer: true,
      shadows: true,
    });
    expect(runtime.shouldEnableOrbitZoom).toBe(false);
  });

  it('wide viewport에서 스크롤 시퀀스가 진행 중이면 OrbitControls를 잠그고 threshold 이상 progress에서는 interaction을 끄어야 한다', () => {
    const runtime = resolveHomeHeroStageCanvasRuntime({
      interactionDisabledProgressThreshold: 0.5,
      isSequenceActive: true,
      progress: 0.5,
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
    });

    expect(runtime.areOrbitControlsEnabled).toBe(false);
    expect(runtime.isInteractionEnabled).toBe(false);
  });

  it('interaction threshold를 높이면 같은 progress에서도 interaction을 유지해야 한다', () => {
    const runtime = resolveHomeHeroStageCanvasRuntime({
      interactionDisabledProgressThreshold: 0.6,
      isSequenceActive: true,
      progress: 0.5,
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
    });

    expect(runtime.isInteractionEnabled).toBe(true);
  });
});
