import { render, waitFor } from '@testing-library/react';
import React from 'react';

import { SceneAssetPreloader } from '@/entities/scene/ui/scene-asset-preloader';

vi.mock('@react-three/drei', () => ({
  useGLTF: {
    preload: vi.fn(),
  },
}));

const preloadMock = vi.hoisted(() => vi.fn());

vi.mock('@/entities/scene/model/preloadGLB', () => ({
  preloadSceneGlbs: (preload: (path: string) => void) => {
    [
      '/models/character.glb',
      '/models/guitar.glb',
      '/models/table.glb',
      '/models/sofa.glb',
    ].forEach(path => {
      preload(path);
      preloadMock(path);
    });
  },
}));

describe('SceneAssetPreloader', () => {
  it('마운트 시 클라이언트에서 GLB preload를 등록한다', async () => {
    render(<SceneAssetPreloader />);

    await waitFor(() => {
      expect(preloadMock).toHaveBeenCalledTimes(4);
    });
  });
});
