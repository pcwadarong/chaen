import { render, waitFor } from '@testing-library/react';
import React from 'react';

import { SceneAssetPreloader } from '@/entities/scene/ui/scene-asset-preloader';

vi.mock('@react-three/drei', () => ({
  useGLTF: {
    preload: vi.fn(),
    setDecoderPath: vi.fn(),
  },
}));

const glbPreloadMock = vi.hoisted(() => vi.fn());

vi.mock('@/entities/scene/model/preloadGLB', () => ({
  preloadSceneGlbs: (preload: (path: string) => void) => {
    [
      '/models/character.v2.glb',
      '/models/bass.v2.glb',
      '/models/table.v2.glb',
      '/models/sofa.v2.glb',
    ].forEach(path => {
      preload(path);
      glbPreloadMock(path);
    });
  },
}));

describe('SceneAssetPreloader', () => {
  it('마운트 시 클라이언트에서 GLB preload를 등록한다', async () => {
    render(<SceneAssetPreloader />);

    await waitFor(() => {
      expect(glbPreloadMock).toHaveBeenCalledTimes(4);
    });
  });

  it('모듈 로드 시 Draco 디코더 경로를 외부 CDN이 아닌 자체 호스팅 경로로 지정한다', async () => {
    // clearMocks 전역 설정 때문에 최초 import 시점의 호출 기록이 지워지므로,
    // 모듈 레지스트리를 초기화하고 다시 import해 module-scope 호출을 재현한다.
    vi.resetModules();

    const { useGLTF: freshUseGLTF } = await import('@react-three/drei');
    await import('@/entities/scene/ui/scene-asset-preloader');

    expect(freshUseGLTF.setDecoderPath).toHaveBeenCalledWith('/decoders/draco/');
  });
});
