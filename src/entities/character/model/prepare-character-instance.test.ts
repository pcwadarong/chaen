import { Box3, BoxGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, Texture } from 'three';

import {
  CHARACTER_OUTFIT_COLOR_CONFIG,
  characterTintMap,
  findCharacterMesh,
  prepareCharacterInstance,
} from '@/entities/character/model/prepare-character-instance';

describe('prepareCharacterInstance', () => {
  it('outer pants ribon hair는 mesh 이름 기준으로 분리된 material 색상을 적용하고 brows 계열은 양면 재질로 복제한다', () => {
    const sourceScene = createCharacterSceneFixture();

    const clonedScene = prepareCharacterInstance(sourceScene, {
      instance: 'main',
      outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.main,
    });

    const sourceOuter = getRequiredMesh(sourceScene, 'outer');
    const clonedOuter = getRequiredMesh(clonedScene, 'outer');
    const sourcePants = getRequiredMesh(sourceScene, 'pants');
    const clonedPants = getRequiredMesh(clonedScene, 'pants');
    const sourceRibon = getRequiredMesh(sourceScene, 'ribon');
    const clonedRibon = getRequiredMesh(clonedScene, 'ribon');
    const sourceHair = getRequiredMesh(sourceScene, 'hair');
    const clonedHair = getRequiredMesh(clonedScene, 'hair');
    const sourceBrows = getRequiredMesh(sourceScene, 'brows');
    const clonedBrows = getRequiredMesh(clonedScene, 'brows');
    const sourceEyebrow = getRequiredMesh(sourceScene, 'eyebrow');
    const clonedEyebrow = getRequiredMesh(clonedScene, 'eyebrow');

    expect(clonedOuter).not.toBe(sourceOuter);
    expect(clonedPants).not.toBe(sourcePants);
    expect(clonedRibon).not.toBe(sourceRibon);
    expect(clonedHair).not.toBe(sourceHair);
    expect(clonedBrows).not.toBe(sourceBrows);
    expect(clonedEyebrow).not.toBe(sourceEyebrow);
    expect(clonedOuter.material).not.toBe(sourceOuter.material);
    expect(clonedPants.material).not.toBe(sourcePants.material);
    expect(clonedRibon.material).not.toBe(sourceRibon.material);
    expect(clonedHair.material).not.toBe(sourceHair.material);
    expect(clonedBrows.material).not.toBe(sourceBrows.material);
    expect(clonedEyebrow.material).not.toBe(sourceEyebrow.material);
    expect(getMaterialColorHex(clonedOuter.material)).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.outer),
    );
    expect(getMaterialColorHex(clonedPants.material)).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.pants),
    );
    expect(getMaterialColorHex(clonedRibon.material)).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.ribon),
    );
    expect(getMaterialColorHex(clonedHair.material)).toBe(normalizeHex(characterTintMap.hair));
    expect(getSingleMaterial(clonedOuter.material).map).toBe(
      getSingleMaterial(sourceOuter.material).map,
    );
    expect(getSingleMaterial(clonedBrows.material).side).toBe(DoubleSide);
    expect(getSingleMaterial(clonedEyebrow.material).side).toBe(DoubleSide);
    expect(getSingleMaterial(sourceBrows.material).side).not.toBe(DoubleSide);
    expect(getSingleMaterial(sourceEyebrow.material).side).not.toBe(DoubleSide);
    expect(getMaterialColorHex(sourceOuter.material)).toBe('ffffff');
    expect(getMaterialColorHex(sourcePants.material)).toBe('ffffff');
    expect(getMaterialColorHex(sourceRibon.material)).toBe('ffffff');
    expect(getMaterialColorHex(sourceHair.material)).toBe('ffffff');
  });

  it('contact 인스턴스에서는 heart와 laptop 계열 노드를 숨기고 body material 공유는 유지한다', () => {
    const sourceScene = createCharacterSceneFixture();

    const clonedScene = prepareCharacterInstance(sourceScene, {
      instance: 'contact',
      outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.contact,
    });

    const sourceHeart = getRequiredMesh(sourceScene, 'heart');
    const clonedHeart = getRequiredMesh(clonedScene, 'heart');
    const clonedLaptop = getRequiredNode(clonedScene, 'laptop');
    const clonedLaptopScreen = getRequiredMesh(clonedScene, 'laptop_screen');
    const sourceBody = getRequiredMesh(sourceScene, 'body');
    const clonedBody = getRequiredMesh(clonedScene, 'body');

    expect(sourceHeart.visible).toBe(true);
    expect(clonedHeart.visible).toBe(false);
    expect(clonedLaptop.visible).toBe(false);
    expect(clonedLaptopScreen.visible).toBe(false);
    expect(clonedBody.material).toBe(sourceBody.material);
  });

  it('clone한 캐릭터 인스턴스의 최저점을 원점에 맞춰 y 위치만 보정한다', () => {
    const sourceScene = createCharacterSceneFixture();

    const clonedScene = prepareCharacterInstance(sourceScene, {
      instance: 'main',
      outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.main,
    });

    expect(sourceScene.position.y).toBe(0);
    expect(clonedScene.position.x).toBe(0);
    expect(clonedScene.position.z).toBe(0);
    expect(clonedScene.position.y).toBeCloseTo(-0.75);
    expect(new Box3().setFromObject(clonedScene).min.y).toBeCloseTo(0);
  });
});

/**
 * 테스트용 캐릭터 scene fixture를 생성합니다.
 */
const createCharacterSceneFixture = (): Group => {
  const scene = new Group();
  const laptopGroup = new Group();
  laptopGroup.name = 'laptop';

  scene.add(createMesh('body', 'body_mat'));
  scene.add(createMesh('outer', 'outer_mat'));
  scene.add(createMesh('pants', 'pants_mat'));
  scene.add(createMesh('ribon', 'ribon_mat'));
  scene.add(createMesh('hair', 'hair_mat'));
  scene.add(createMesh('brows', 'brows_mat'));
  scene.add(createMesh('eyebrow', 'eyebrow_mat'));
  scene.add(createMesh('heart', 'heart_mat'));
  scene.add(createMesh('laptop_screen', 'laptop_screen_mat'));
  laptopGroup.add(createMesh('Cube', 'laptop_mat'));
  scene.add(laptopGroup);

  return scene;
};

/**
 * 이름과 material 이름만 지정한 최소 mesh fixture를 생성합니다.
 */
const createMesh = (name: string, materialName: string): Mesh => {
  const material = new MeshStandardMaterial({ color: '#ffffff' });
  material.name = materialName;
  material.map = new Texture();

  const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
  mesh.name = name;
  mesh.position.y = 1.25;

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
 * 이름 기준으로 장면 안의 임의 Object3D를 조회합니다.
 */
const getRequiredNode = (scene: Group, name: string) => {
  const targetNode = scene.getObjectByName(name);

  if (!targetNode) {
    throw new Error(`node not found: ${name}`);
  }

  return targetNode;
};

/**
 * 단일 material의 현재 색상을 hex 문자열로 반환합니다.
 */
const getMaterialColorHex = (material: Mesh['material']): string =>
  getSingleMaterial(material).color.getHexString();

/**
 * `#rrggbb` 형식 색상을 비교용 `rrggbb`로 정규화합니다.
 */
const normalizeHex = (color: string): string => color.replace('#', '').toLowerCase();

/**
 * 테스트에서 단일 MeshStandardMaterial만 사용하는 fixture를 안전하게 꺼냅니다.
 */
const getSingleMaterial = (material: Mesh['material']): MeshStandardMaterial => {
  if (Array.isArray(material)) {
    throw new Error('array material is not supported in this test');
  }

  if (!(material instanceof MeshStandardMaterial)) {
    throw new Error('mesh standard material is required in this test');
  }

  return material;
};
