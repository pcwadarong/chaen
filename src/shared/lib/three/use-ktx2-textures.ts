'use client';

import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { Texture } from 'three';

import { resolveKtx2Loader } from '@/shared/lib/three/ktx2-loader';

/**
 * GLB 밖에 있는 `.ktx2` 텍스처를 로드합니다. drei `useTexture`의 KTX2 대응입니다.
 *
 * drei에도 `useKTX2`가 있지만 three-stdlib의 KTX2Loader를 쓰고 basis transcoder 기본 경로가
 * 외부 CDN입니다. 자체 호스팅한 transcoder와 구현을 하나로 맞추기 위해 three의 KTX2Loader를
 * 직접 씁니다.
 *
 * `useLoader`에 생성자가 아니라 **설정이 끝난 인스턴스**를 넘깁니다. 생성자를 넘기면 R3F가
 * 클래스마다 인스턴스를 따로 만들어 GLB 경로와 worker pool·transcoder wasm이 이중으로 뜹니다.
 *
 * 첫 렌더가 아니라 즉시 GPU에 올리는 `gl.initTexture` 호출은 drei와 같은 이유입니다
 * (https://github.com/mrdoob/three.js/issues/22696).
 */
export const useKtx2Textures = (paths: readonly string[]): Texture[] => {
  const gl = useThree(state => state.gl);
  const loader = useMemo(() => resolveKtx2Loader(gl), [gl]);
  const textures = useLoader(loader, [...paths]);

  useEffect(() => {
    textures.forEach(texture => {
      gl.initTexture(texture);
    });
  }, [gl, textures]);

  return textures;
};
