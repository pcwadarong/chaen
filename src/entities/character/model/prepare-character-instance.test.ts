import { Group, Mesh, MeshStandardMaterial } from 'three';

import {
  characterTintMap,
  findCharacterMesh,
  prepareCharacterInstance,
} from '@/entities/character/model/prepare-character-instance';

describe('prepareCharacterInstance', () => {
  it('outfit과 hair material을 복제하고 각 인스턴스 tint를 적용한다', () => {
    const sourceScene = createCharacterSceneFixture();

    const clonedScene = prepareCharacterInstance(sourceScene);

    const sourceOutfit = getRequiredMesh(sourceScene, 'outfit');
    const clonedOutfit = getRequiredMesh(clonedScene, 'outfit');
    const sourceHair = getRequiredMesh(sourceScene, 'hair');
    const clonedHair = getRequiredMesh(clonedScene, 'hair');

    expect(clonedOutfit).not.toBe(sourceOutfit);
    expect(clonedHair).not.toBe(sourceHair);
    expect(clonedOutfit.material).not.toBe(sourceOutfit.material);
    expect(clonedHair.material).not.toBe(sourceHair.material);
    expect(getMaterialColorHex(clonedOutfit.material)).toBe(normalizeHex(characterTintMap.outfit));
    expect(getMaterialColorHex(clonedHair.material)).toBe(normalizeHex(characterTintMap.hair));
    expect(getMaterialColorHex(sourceOutfit.material)).toBe('ffffff');
    expect(getMaterialColorHex(sourceHair.material)).toBe('ffffff');
  });

  it('heart만 숨기고 다른 mesh의 공유 material은 유지한다', () => {
    const sourceScene = createCharacterSceneFixture();

    const clonedScene = prepareCharacterInstance(sourceScene);

    const sourceHeart = getRequiredMesh(sourceScene, 'heart');
    const clonedHeart = getRequiredMesh(clonedScene, 'heart');
    const sourceBody = getRequiredMesh(sourceScene, 'body');
    const clonedBody = getRequiredMesh(clonedScene, 'body');

    expect(sourceHeart.visible).toBe(true);
    expect(clonedHeart.visible).toBe(false);
    expect(clonedBody.material).toBe(sourceBody.material);
  });
});

/**
 * 테스트용 캐릭터 scene fixture를 생성합니다.
 */
const createCharacterSceneFixture = (): Group => {
  const scene = new Group();

  scene.add(createMesh('body', 'body_mat'));
  scene.add(createMesh('outfit', 'outfit_mat'));
  scene.add(createMesh('hair', 'hair_mat'));
  scene.add(createMesh('heart', 'heart_mat'));

  return scene;
};

/**
 * 이름과 material 이름만 지정한 최소 mesh fixture를 생성합니다.
 */
const createMesh = (name: string, materialName: string): Mesh => {
  const material = new MeshStandardMaterial({ color: '#ffffff' });
  material.name = materialName;

  const mesh = new Mesh(undefined, material);
  mesh.name = name;

  return mesh;
};

/**
 * 테스트에서 반드시 존재해야 하는 mesh를 반환합니다.
 */
const getRequiredMesh = (scene: Group, name: string): Mesh => {
  const mesh = findCharacterMesh(scene, name);

  if (!mesh) {
    throw new Error(`mesh not found: ${name}`);
  }

  return mesh;
};

/**
 * 단일 material의 현재 색상을 hex 문자열로 반환합니다.
 */
const getMaterialColorHex = (material: Mesh['material']): string => {
  if (Array.isArray(material)) {
    throw new Error('array material is not supported in this test');
  }

  if (!(material instanceof MeshStandardMaterial)) {
    throw new Error('mesh standard material is required in this test');
  }

  return material.color.getHexString();
};

/**
 * `#rrggbb` 형식 색상을 비교용 `rrggbb`로 정규화합니다.
 */
const normalizeHex = (color: string): string => color.replace('#', '').toLowerCase();
