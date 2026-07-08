'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

import { preloadSceneGlbs } from '@/entities/scene/model/preloadGLB';

// 현재 GLB는 전부 Meshopt로 전환되어 Draco 디코더가 실제로 쓰이진 않지만,
// drei useGLTF는 기본으로 DRACOLoader를 준비해 외부(Google 정적 호스팅) CDN 경로를 세팅한다.
// 방어적으로 자체 호스팅 경로를 지정해 향후에도 외부 CDN 의존을 완전히 제거한다.
useGLTF.setDecoderPath('/decoders/draco/');

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
