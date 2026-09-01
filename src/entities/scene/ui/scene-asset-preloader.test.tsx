import { render, waitFor } from '@testing-library/react';
import React from 'react';

import { SceneAssetPreloader } from '@/entities/scene/ui/scene-asset-preloader';

const SCENE_GLB_PATHS = [
  '/models/character.v4.glb',
  '/models/bass.v4.glb',
  '/models/table.v4.glb',
  '/models/sofa.v4.glb',
];

vi.mock('@/entities/scene/model/preloadGLB', () => ({
  preloadSceneGlbs: (preload: (path: string) => void) => {
    SCENE_GLB_PATHS.forEach(preload);
  },
}));

describe('SceneAssetPreloader', () => {
  it('마운트 시 씬 GLB를 모두 프리페치해 HTTP 캐시를 데운다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());

    vi.stubGlobal('fetch', fetchMock);
    render(<SceneAssetPreloader />);

    await waitFor(() => {
      expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(SCENE_GLB_PATHS);
    });
  });

  it('프리페치가 실패해도 예외를 밖으로 던지지 않는다', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));

    vi.stubGlobal('fetch', fetchMock);

    expect(() => render(<SceneAssetPreloader />)).not.toThrow();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(SCENE_GLB_PATHS.length);
    });
  });
});
