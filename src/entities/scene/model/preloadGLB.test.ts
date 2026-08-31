import { describe, expect, it, vi } from 'vitest';

import {
  BASS_MODEL_PATH,
  CHARACTER_MODEL_PATH,
  preloadSceneGlbs,
  sceneModelPaths,
  SOFA_MODEL_PATH,
  TABLE_MODEL_PATH,
} from '@/entities/scene/model/preloadGLB';

describe('preloadGLB', () => {
  it('등록된 GLB 경로를 모두 전달받은 preload 함수에 넘긴다', () => {
    const preload = vi.fn();

    preloadSceneGlbs(preload);

    expect(sceneModelPaths).toEqual([
      CHARACTER_MODEL_PATH,
      BASS_MODEL_PATH,
      TABLE_MODEL_PATH,
      SOFA_MODEL_PATH,
    ]);
    expect(sceneModelPaths).toEqual([
      '/models/character.v3.glb',
      '/models/bass.v3.glb',
      '/models/table.v3.glb',
      '/models/sofa.v3.glb',
    ]);
    expect(preload).toHaveBeenCalledTimes(4);
    expect(preload).toHaveBeenNthCalledWith(1, CHARACTER_MODEL_PATH);
    expect(preload).toHaveBeenNthCalledWith(2, BASS_MODEL_PATH);
    expect(preload).toHaveBeenNthCalledWith(3, TABLE_MODEL_PATH);
    expect(preload).toHaveBeenNthCalledWith(4, SOFA_MODEL_PATH);
  });
});
