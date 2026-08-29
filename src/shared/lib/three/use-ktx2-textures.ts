'use client';

import { useLoader, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Texture } from 'three';

import { extendKtx2TextureLoader, KTX2Loader } from '@/shared/lib/three/ktx2-loader';

/**
 * GLB 밖에 있는 `.ktx2` 텍스처를 로드합니다. drei `useTexture`의 KTX2 대응입니다.
 *
 * drei에도 `useKTX2`가 있지만 three-stdlib의 KTX2Loader를 쓰고 basis transcoder 기본 경로가
 * 외부 CDN입니다. 자체 호스팅한 transcoder와 구현을 하나로 맞추기 위해 three의 KTX2Loader를
 * 직접 씁니다.
 *
 * 첫 렌더 때가 아니라 즉시 GPU에 올리는 `gl.initTexture` 호출은 drei와 같은 이유입니다
 * (https://github.com/mrdoob/three.js/issues/22696).
 */
export const useKtx2Textures = (paths: readonly string[]): Texture[] => {
  const gl = useThree(state => state.gl);
  const textures = useLoader(KTX2Loader, [...paths], extendKtx2TextureLoader(gl));

  useEffect(() => {
    textures.forEach(texture => {
      gl.initTexture(texture);
    });
  }, [gl, textures]);

  return textures;
};
