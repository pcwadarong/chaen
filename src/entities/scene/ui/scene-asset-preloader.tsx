'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

import { preloadSceneGlbs } from '@/entities/scene/model/preloadGLB';

/**
 * 클라이언트에서만 Three GLB 자산 프리로드를 등록합니다.
 */
export const SceneAssetPreloader = () => {
  useEffect(() => {
    preloadSceneGlbs(path => {
      useGLTF.preload(path);
    });
  }, []);

  return null;
};
