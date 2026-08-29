'use client';

import type { WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/**
 * basis transcoder는 자체 호스팅한다. `/decoders/draco/`와 나란히 두어 CDN 의존을 만들지 않는다.
 * 파일은 `pnpm sync:decoders`가 `three/examples/jsm/libs/basis`에서 복사한다.
 */
export const KTX2_TRANSCODER_PATH = '/decoders/basis/';

let sharedGltfLoader: KTX2Loader | null = null;
let firstSupportSignature: string | null = null;

/**
 * KTX2Loader에 transcoder 경로와 렌더러별 지원 포맷을 설정합니다.
 *
 * 홈은 canvas가 2개(hero + contact)라 WebGL 컨텍스트도 2개입니다. 그런데 R3F는 로드 결과를
 * URL 단위로 전역 캐시하므로, KTX2는 **먼저 로드한 컨텍스트의 지원 포맷으로 한 번만
 * transcode되어 두 컨텍스트가 같은 CompressedTexture를 공유**합니다. 캐릭터 GLB도 한 번
 * 파싱해 두 씬이 clone해 쓰므로 이 공유 자체는 피할 수 없고, 피할 이유도 없습니다 —
 * 지원 포맷은 컨텍스트 속성이 아니라 GPU/브라우저의 성질이고, 두 캔버스는 같은 문서·같은
 * GPU에서 만들어지며 `powerPreference`도 지정하지 않기 때문입니다.
 *
 * 그래서 로더를 렌더러마다 따로 두는 대신, **두 렌더러의 지원 포맷이 실제로 같은지 검증**합니다.
 * 어긋나면 이미 transcode된 텍스처를 되돌릴 수 없으므로 조용히 깨지는 대신 경고를 남깁니다.
 */
export const configureKtx2Loader = (loader: KTX2Loader, renderer: WebGLRenderer): KTX2Loader => {
  loader.setTranscoderPath(KTX2_TRANSCODER_PATH);
  loader.detectSupport(renderer);

  // 확장 목록을 여기서 다시 나열하지 않고 detectSupport가 만든 결과를 그대로 비교한다 —
  // three가 질의 항목을 바꿔도 검증이 같이 따라간다.
  const signature = JSON.stringify(loader.workerConfig);

  if (firstSupportSignature === null) {
    firstSupportSignature = signature;
  } else if (firstSupportSignature !== signature && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[ktx2] 두 캔버스의 GPU 압축 포맷 지원이 다릅니다. ' +
        `먼저 로드한 쪽: ${firstSupportSignature}, 지금: ${signature}. ` +
        'transcode 결과는 URL 단위로 공유되므로 한쪽에서 텍스처가 깨질 수 있습니다.',
    );
  }

  return loader;
};

/**
 * GLTFLoader에 물릴 KTX2Loader를 돌려줍니다.
 * GLB 파싱 결과가 어차피 전역 캐시되므로 인스턴스도 하나만 두고,
 * 렌더러 간 지원 포맷 차이는 {@link configureKtx2Loader}가 검증합니다.
 */
export const resolveGltfKtx2Loader = (renderer: WebGLRenderer): KTX2Loader => {
  sharedGltfLoader ??= new KTX2Loader();

  return configureKtx2Loader(sharedGltfLoader, renderer);
};

/**
 * GLB 밖의 `.ktx2` 텍스처를 R3F `useLoader`로 읽을 때 쓰는 loader 확장자입니다.
 */
export const extendKtx2TextureLoader =
  (renderer: WebGLRenderer) =>
  (loader: KTX2Loader): void => {
    configureKtx2Loader(loader, renderer);
  };

/**
 * 테스트에서 모듈 상태(최초 렌더러의 지원 포맷 기록)를 초기화합니다.
 */
export const resetKtx2LoaderStateForTest = (): void => {
  sharedGltfLoader = null;
  firstSupportSignature = null;
};

export { KTX2Loader };
