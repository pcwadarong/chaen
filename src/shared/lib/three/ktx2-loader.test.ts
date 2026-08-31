// @vitest-environment node
import type { WebGLRenderer } from 'three';

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

/** 모듈 스코프에 공유 로더 상태가 남으므로 테스트마다 새로 import한다. */
const importFresh = async () => {
  vi.resetModules();

  return import('@/shared/lib/three/ktx2-loader');
};

describe('ktx2-loader', () => {
  it('transcoder를 외부 CDN이 아니라 자체 호스팅 경로에서 읽는다', async () => {
    const { KTX2_TRANSCODER_PATH, resolveKtx2Loader } = await importFresh();
    const loader = resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));

    expect(KTX2_TRANSCODER_PATH).toBe('/decoders/basis/');
    expect(loader.transcoderPath).toBe(KTX2_TRANSCODER_PATH);
  });

  it('렌더러가 지원하는 포맷을 transcode 대상으로 감지한다', async () => {
    const { resolveKtx2Loader } = await importFresh();
    const loader = resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));

    expect(loader.workerConfig).toMatchObject({
      astcSupported: false,
      bptcSupported: true,
      dxtSupported: true,
      etc2Supported: false,
    });
  });

  it('캔버스가 늘어도 로더 인스턴스는 하나만 쓴다 — worker pool과 transcoder wasm이 이중으로 뜨지 않게', async () => {
    const { resolveKtx2Loader } = await importFresh();
    const first = resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    const second = resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));

    expect(second).toBe(first);
  });

  it('두 번째 캔버스에서 지원 포맷을 다시 감지해 공유 로더의 설정을 덮어쓰지 않는다', async () => {
    const { resolveKtx2Loader } = await importFresh();
    const loader = resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    const detected = { ...loader.workerConfig };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveKtx2Loader(createRenderer(MOBILE_EXTENSIONS));

    // worker는 생성 시점의 workerConfig를 구워 가므로, 덮어쓰면 한 pool 안에 설정이 섞인다.
    expect(loader.workerConfig).toEqual(detected);
  });

  it('두 캔버스의 지원 포맷이 다르면 경고한다 — transcode 결과는 URL 단위로 공유되기 때문이다', async () => {
    const { resolveKtx2Loader } = await importFresh();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    resolveKtx2Loader(createRenderer(MOBILE_EXTENSIONS));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktx2]'));
  });

  it('두 캔버스의 지원 포맷이 같으면 경고하지 않는다', async () => {
    const { resolveKtx2Loader } = await importFresh();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveKtx2Loader(createRenderer(DESKTOP_EXTENSIONS));
    resolveKtx2Loader(createRenderer([...DESKTOP_EXTENSIONS].reverse()));

    expect(warn).not.toHaveBeenCalled();
  });
});
