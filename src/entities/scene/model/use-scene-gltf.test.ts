import { useGLTF } from '@react-three/drei';
import type { WebGLRenderer } from 'three';

vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(vi.fn(), { setDecoderPath: vi.fn() }),
}));

const rendererMock = {
  extensions: {
    get: () => ({ getSupportedProfiles: () => [] }),
    has: () => false,
  },
} as unknown as WebGLRenderer;

vi.mock('@react-three/fiber', () => ({
  useThree: (select: (state: { gl: WebGLRenderer }) => unknown) => select({ gl: rendererMock }),
}));

describe('useSceneGltf', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Draco 디코더를 외부 CDN이 아닌 자체 호스팅 경로에서 읽는다', async () => {
    await import('@/entities/scene/model/use-scene-gltf');

    expect(useGLTF.setDecoderPath).toHaveBeenCalledWith('/decoders/draco/');
  });

  it('GLB의 KTX2 텍스처를 풀 수 있도록 GLTFLoader에 KTX2Loader를 물린다', async () => {
    const { useSceneGltf } = await import('@/entities/scene/model/use-scene-gltf');

    useSceneGltf('/models/character.v3.glb');

    const [path, useDraco, useMeshopt, extendLoader] = vi.mocked(useGLTF).mock.calls[0];
    const setKTX2Loader = vi.fn();

    expect(path).toBe('/models/character.v3.glb');
    expect([useDraco, useMeshopt]).toEqual([true, true]);

    extendLoader?.({ setKTX2Loader } as never);

    expect(setKTX2Loader).toHaveBeenCalledWith(
      expect.objectContaining({ transcoderPath: '/decoders/basis/' }),
    );
  });
});
