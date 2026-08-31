'use client';

import type { WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/**
 * basis transcoder는 자체 호스팅한다. `/decoders/draco/`와 나란히 두어 CDN 의존을 만들지 않는다.
 * 파일은 `pnpm sync:decoders`가 `three/examples/jsm/libs/basis`에서 복사한다.
 */
export const KTX2_TRANSCODER_PATH = '/decoders/basis/';

let sharedLoader: KTX2Loader | null = null;
let detectedSupport: string | null = null;

/**
 * 렌더러가 지원하는 압축 포맷을 로더에 감지시키고 비교 가능한 문자열로 돌려줍니다.
 * 확장 목록을 여기서 다시 나열하지 않고 `detectSupport`가 만든 결과를 그대로 쓰므로,
 * three가 질의 항목을 바꿔도 검증이 같이 따라갑니다.
 */
const detectSupportSignature = (loader: KTX2Loader, renderer: WebGLRenderer): string => {
  loader.detectSupport(renderer);

  return JSON.stringify(loader.workerConfig);
};

/**
 * 두 번째 캔버스의 지원 포맷이 첫 번째와 같은지 확인하고, 다르면 개발 환경에서 경고합니다.
 *
 * 공유 로더에 `detectSupport`를 다시 부르면 안 됩니다. `KTX2Loader`는 worker를 만들 때
 * **그 시점의 `workerConfig`를 구워 넣으므로**(`postMessage({ type: 'init', config })`),
 * 나중에 덮어쓰면 한 pool 안에 설정이 다른 worker가 섞입니다. 그래서 검증은 버릴 로더로 합니다.
 */
const warnOnSupportMismatch = (renderer: WebGLRenderer): void => {
  if (process.env.NODE_ENV === 'production') return;

  const signature = detectSupportSignature(new KTX2Loader(), renderer);

  if (signature === detectedSupport) return;

  console.warn(
    '[ktx2] 두 캔버스의 GPU 압축 포맷 지원이 다릅니다. ' +
      `먼저 로드한 쪽: ${detectedSupport}, 지금: ${signature}. ` +
      'transcode 결과는 URL 단위로 공유되므로 한쪽에서 텍스처가 깨질 수 있습니다.',
  );
};

/**
 * GLB와 독립 `.ktx2` 텍스처가 함께 쓰는 KTX2Loader를 돌려줍니다.
 *
 * **인스턴스는 하나뿐입니다.** `KTX2Loader`는 인스턴스마다 worker 4개짜리 pool을 들고
 * worker마다 transcoder wasm(약 0.5MB)을 복사해 가므로, GLB 경로와 텍스처 경로가 로더를
 * 따로 쓰면 이 비용이 그대로 두 배가 됩니다.
 *
 * **`detectSupport`도 첫 렌더러에서 한 번만 합니다.** 홈은 캔버스가 2개(hero + contact)라
 * 스킬이 경고하는 "전역 싱글턴 금지" 자리지만, R3F는 로드 결과를 URL 단위로 전역 캐시하므로
 * KTX2는 먼저 로드한 컨텍스트의 지원 포맷으로 한 번만 transcode되어 두 컨텍스트가 같은
 * `CompressedTexture`를 공유합니다. 캐릭터 GLB도 한 번 파싱해 두 씬이 clone해 쓰므로 이
 * 공유는 로더를 나눠도 사라지지 않습니다 — 나누면 GLB를 두 번 받게 될 뿐입니다.
 *
 * 지원 포맷은 컨텍스트 속성이 아니라 GPU/브라우저의 성질이고 두 캔버스는 같은 문서·같은
 * GPU에서 `powerPreference` 없이 만들어지므로 같아야 합니다. 그래서 로더를 나누는 대신
 * {@link warnOnSupportMismatch}로 실제로 같은지 검증합니다.
 */
export const resolveKtx2Loader = (renderer: WebGLRenderer): KTX2Loader => {
  if (sharedLoader) {
    warnOnSupportMismatch(renderer);

    return sharedLoader;
  }

  const loader = new KTX2Loader().setTranscoderPath(KTX2_TRANSCODER_PATH);

  detectedSupport = detectSupportSignature(loader, renderer);
  sharedLoader = loader;

  return loader;
};

export { KTX2Loader };
