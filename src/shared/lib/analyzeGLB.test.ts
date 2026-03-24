import { AnimationClip, Bone, Group, Mesh, MeshStandardMaterial } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { analyzeGLB } from '@/shared/lib/analyzeGLB';

describe('analyzeGLB', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('development 환경에서 노드와 애니메이션 구조를 출력한다', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const gltf = createGltfFixture();

    analyzeGLB(gltf);

    expect(consoleInfoSpy).toHaveBeenCalledWith('[NODE] root | material: -');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[MESH] outfit | material: outfit_mat');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[BONE] spine | material: -');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[ANIMATIONS] idle, typing');
  });

  it('development 환경이 아니면 아무 로그도 남기지 않는다', () => {
    vi.stubEnv('NODE_ENV', 'test');

    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    analyzeGLB(createGltfFixture());

    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });
});

/**
 * analyzeGLB 테스트에 사용할 최소 GLTF 구조를 생성합니다.
 */
const createGltfFixture = (): GLTF => {
  const root = new Group();
  root.name = 'root';

  const outfitMaterial = new MeshStandardMaterial({ color: '#ffffff' });
  outfitMaterial.name = 'outfit_mat';

  const outfit = new Mesh(undefined, outfitMaterial);
  outfit.name = 'outfit';

  const spine = new Bone();
  spine.name = 'spine';

  root.add(outfit);
  root.add(spine);

  return {
    animations: [new AnimationClip('idle'), new AnimationClip('typing')],
    asset: { generator: 'vitest', version: '2.0' },
    cameras: [],
    parser: {} as GLTF['parser'],
    scene: root,
    scenes: [root],
    userData: {},
  } as GLTF;
};
