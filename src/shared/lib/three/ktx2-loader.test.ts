import type { WebGLRenderer } from 'three';

import {
  configureKtx2Loader,
  KTX2_TRANSCODER_PATH,
  KTX2Loader,
  resetKtx2LoaderStateForTest,
  resolveGltfKtx2Loader,
} from '@/shared/lib/three/ktx2-loader';

/**
 * `detectSupport`가 실제로 질의하는 것은 렌더러의 압축 텍스처 확장 목록뿐이라,
 * 지원 포맷 집합만 흉내 낸 최소 렌더러로 검증한다.
 */
const createRenderer = (supportedExtensions: string[]): WebGLRenderer =>
  ({
    extensions: {
      get: () => ({ getSupportedProfiles: () => [] }),
      has: (name: string) => supportedExtensions.includes(name),
    },
  }) as unknown as WebGLRenderer;

const DESKTOP_EXTENSIONS = ['WEBGL_compressed_texture_s3tc', 'EXT_texture_compression_bptc'];
const MOBILE_EXTENSIONS = ['WEBGL_compressed_texture_etc', 'WEBGL_compressed_texture_astc'];

describe('ktx2-loader', () => {
  beforeEach(() => {
    resetKtx2LoaderStateForTest();
  });

  it('transcoder를 외부 CDN이 아니라 자체 호스팅 경로에서 읽는다', () => {
    const loader = configureKtx2Loader(new KTX2Loader(), createRenderer(DESKTOP_EXTENSIONS));

    expect(KTX2_TRANSCODER_PATH).toBe('/decoders/basis/');
    expect(loader.transcoderPath).toBe(KTX2_TRANSCODER_PATH);
  });

  it('렌더러가 지원하는 포맷을 transcode 대상으로 감지한다', () => {
    const loader = configureKtx2Loader(new KTX2Loader(), createRenderer(DESKTOP_EXTENSIONS));

    expect(loader.workerConfig).toMatchObject({
      astcSupported: false,
      bptcSupported: true,
      dxtSupported: true,
      etc2Supported: false,
    });
  });

  it('GLB용 KTX2Loader는 하나만 두고 캔버스마다 지원 포맷을 다시 감지한다', () => {
    const first = resolveGltfKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    const second = resolveGltfKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));

    expect(second).toBe(first);
  });

  it('두 캔버스의 지원 포맷이 다르면 경고한다 — transcode 결과는 URL 단위로 공유되기 때문이다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveGltfKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    resolveGltfKtx2Loader(createRenderer(MOBILE_EXTENSIONS));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktx2]'));
  });

  it('두 캔버스의 지원 포맷이 같으면 경고하지 않는다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveGltfKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    resolveGltfKtx2Loader(createRenderer([...DESKTOP_EXTENSIONS].reverse()));

    expect(warn).not.toHaveBeenCalled();
  });
});
