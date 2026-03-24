import { beforeEach, describe, expect, it, vi } from 'vitest';

const preloadMock = vi.fn();

vi.mock('@react-three/drei', () => ({
  useGLTF: {
    preload: preloadMock,
  },
}));

describe('preloadGLB', () => {
  beforeEach(() => {
    preloadMock.mockClear();
    vi.resetModules();
  });

  it('등록된 GLB 경로를 모두 preload한다', async () => {
    const preloadModule = await import('@/entities/scene/model/preloadGLB');

    expect(preloadModule.sceneModelPaths).toEqual([
      '/models/character.glb',
      '/models/guitar.glb',
      '/models/table.glb',
      '/models/sofa.glb',
    ]);
    expect(preloadMock).toHaveBeenCalledTimes(4);
    expect(preloadMock).toHaveBeenNthCalledWith(1, '/models/character.glb');
    expect(preloadMock).toHaveBeenNthCalledWith(2, '/models/guitar.glb');
    expect(preloadMock).toHaveBeenNthCalledWith(3, '/models/table.glb');
    expect(preloadMock).toHaveBeenNthCalledWith(4, '/models/sofa.glb');
  });
});
