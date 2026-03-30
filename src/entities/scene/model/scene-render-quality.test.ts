/* @vitest-environment node */

import { SCENE_VIEWPORT_MODE } from '@/entities/scene/model/breakpointConfig';
import {
  getContactSceneRenderQuality,
  getHomeHeroSceneRenderQuality,
} from '@/entities/scene/model/scene-render-quality';

describe('getHomeHeroSceneRenderQuality', () => {
  it('stacked viewport에서는 홈 히어로 렌더 비용을 낮춰야 한다', () => {
    expect(
      getHomeHeroSceneRenderQuality({
        sceneViewportMode: SCENE_VIEWPORT_MODE.stacked,
      }),
    ).toEqual({
      dpr: [1, 1.25],
      enableOutlineComposer: false,
      shadows: false,
    });
  });

  it('wide viewport에서는 홈 히어로 풀 품질을 유지해야 한다', () => {
    expect(
      getHomeHeroSceneRenderQuality({
        sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
      }),
    ).toEqual({
      dpr: [1, 2],
      enableOutlineComposer: true,
      shadows: true,
    });
  });
});

describe('getContactSceneRenderQuality', () => {
  it('desktopMax 미만 contact viewport에서는 contact scene DPR 상한을 낮춰야 한다', () => {
    expect(
      getContactSceneRenderQuality({
        viewportWidth: 1100,
      }),
    ).toEqual({
      dpr: [1, 1.35],
      enableOutlineComposer: false,
      shadows: true,
    });
  });

  it('넓은 desktop contact viewport에서는 contact scene 품질 상한을 조금 더 높여야 한다', () => {
    expect(
      getContactSceneRenderQuality({
        viewportWidth: 1440,
      }),
    ).toEqual({
      dpr: [1, 1.5],
      enableOutlineComposer: false,
      shadows: true,
    });
  });
});
