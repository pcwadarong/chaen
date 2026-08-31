'use client';

import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { resolveKtx2Loader } from '@/shared/lib/three/ktx2-loader';

// GLB는 전부 Meshopt로 압축되어 Draco 디코더가 실제로 쓰이진 않지만,
// drei useGLTF는 기본으로 DRACOLoader를 준비해 외부(Google 정적 호스팅) CDN 경로를 세팅한다.
// 방어적으로 자체 호스팅 경로를 지정해 향후에도 외부 CDN 의존을 완전히 제거한다.
// 씬 GLB를 여는 유일한 통로가 이 모듈이므로 첫 로드보다 반드시 먼저 실행된다.
useGLTF.setDecoderPath('/decoders/draco/');

type SceneGltf = ReturnType<typeof useGLTF<string>>;
type GltfExtendLoader = NonNullable<Parameters<typeof useGLTF<string>>[3]>;
type StdlibKtx2Loader = Parameters<Parameters<GltfExtendLoader>[0]['setKTX2Loader']>[0];

/**
 * 씬 GLB를 로드합니다. 텍스처가 KTX2(`KHR_texture_basisu`)라 GLTFLoader에 KTX2Loader를 물려야 하고,
 * KTX2Loader는 transcode 대상 포맷을 정하려고 실제 `WebGLRenderer`를 요구합니다.
 * 그래서 이 훅은 반드시 `<Canvas>` 안에서 호출해야 합니다.
 */
export const useSceneGltf = (path: string): SceneGltf => {
  const gl = useThree(state => state.gl);

  return useGLTF(path, true, true, loader => {
    // drei의 GLTFLoader는 three-stdlib 것이라 KTX2Loader 타입도 three-stdlib 선언을 요구한다.
    // three-stdlib은 직접 의존성이 아니므로(drei의 전이 의존) three 본체의 KTX2Loader를 쓰고,
    // 구조만 같으면 되는 자리라 여기서 한 번만 좁혀 준다.
    loader.setKTX2Loader(resolveKtx2Loader(gl) as unknown as StdlibKtx2Loader);
  });
};
