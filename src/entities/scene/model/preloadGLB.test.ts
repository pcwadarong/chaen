import { describe, expect, it, vi } from 'vitest';

import { preloadSceneGlbs, sceneModelPaths } from '@/entities/scene/model/preloadGLB';

describe('preloadGLB', () => {
  it('등록된 GLB 경로를 모두 전달받은 preload 함수에 넘긴다', () => {
    const preload = vi.fn();

    preloadSceneGlbs(preload);

    expect(sceneModelPaths).toEqual([
      '/models/character.glb',
      '/models/guitar.glb',
      '/models/table.glb',
      '/models/sofa.glb',
    ]);
    expect(preload).toHaveBeenCalledTimes(4);
    expect(preload).toHaveBeenNthCalledWith(1, '/models/character.glb');
    expect(preload).toHaveBeenNthCalledWith(2, '/models/guitar.glb');
    expect(preload).toHaveBeenNthCalledWith(3, '/models/table.glb');
    expect(preload).toHaveBeenNthCalledWith(4, '/models/sofa.glb');
  });
});
