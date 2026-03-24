import { Group, Mesh, MeshStandardMaterial, Texture } from 'three';

import {
  CHARACTER_OUTFIT_COLOR_CONFIG,
  characterTintMap,
  createOutfitIdMapMaterial,
  findCharacterMesh,
  outfitColorConfig,
  prepareCharacterInstance,
} from '@/entities/character/model/prepare-character-instance';

describe('prepareCharacterInstance', () => {
  it('outfit은 ID 맵 셰이더 material을 적용하고 hair는 tint material을 적용한다', () => {
    const sourceScene = createCharacterSceneFixture();
    const outfitIdMap = new Texture();

    const clonedScene = prepareCharacterInstance(sourceScene, {
      outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.main,
      outfitIdMap,
    });

    const sourceOutfit = getRequiredMesh(sourceScene, 'outfit');
    const clonedOutfit = getRequiredMesh(clonedScene, 'outfit');
    const sourceHair = getRequiredMesh(sourceScene, 'hair');
    const clonedHair = getRequiredMesh(clonedScene, 'hair');

    expect(clonedOutfit).not.toBe(sourceOutfit);
    expect(clonedHair).not.toBe(sourceHair);
    expect(clonedOutfit.material).not.toBe(sourceOutfit.material);
    expect(clonedHair.material).not.toBe(sourceHair.material);
    expect(getMaterialColorHex(clonedHair.material)).toBe(normalizeHex(characterTintMap.hair));
    expect(getSingleMaterial(clonedOutfit.material).map).not.toBe(
      getSingleMaterial(sourceOutfit.material).map,
    );
    expect(getMaterialColorHex(sourceOutfit.material)).toBe('ffffff');
    expect(getMaterialColorHex(sourceHair.material)).toBe('ffffff');

    const shader = createShaderFixture();
    getSingleMaterial(clonedOutfit.material).onBeforeCompile?.(shader, {} as never);

    expect(shader.uniforms.uIdMap?.value).toBe(outfitIdMap);
    expect(shader.uniforms.uColorOuter?.value.getHexString()).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.outer),
    );
    expect(shader.uniforms.uColorPants?.value.getHexString()).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.pants),
    );
    expect(shader.uniforms.uColorRibon?.value.getHexString()).toBe(
      normalizeHex(CHARACTER_OUTFIT_COLOR_CONFIG.main.ribon),
    );
    expect(shader.fragmentShader).toContain('uniform sampler2D uIdMap;');
    expect(shader.fragmentShader).toContain('if (idColor.r > 0.9)');
  });

  it('heart만 숨기고 다른 mesh의 공유 material은 유지한다', () => {
    const sourceScene = createCharacterSceneFixture();
    const outfitIdMap = new Texture();

    const clonedScene = prepareCharacterInstance(sourceScene, {
      outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.contact,
      outfitIdMap,
    });

    const sourceHeart = getRequiredMesh(sourceScene, 'heart');
    const clonedHeart = getRequiredMesh(clonedScene, 'heart');
    const sourceBody = getRequiredMesh(sourceScene, 'body');
    const clonedBody = getRequiredMesh(clonedScene, 'body');

    expect(sourceHeart.visible).toBe(true);
    expect(clonedHeart.visible).toBe(false);
    expect(clonedBody.material).toBe(sourceBody.material);
  });
});

describe('createOutfitIdMapMaterial', () => {
  it('원본 map을 복제한 MeshStandardMaterial을 생성한다', () => {
    const diffuseMap = new Texture();
    const originalMaterial = new MeshStandardMaterial({ color: '#ffffff' });
    const outfitIdMap = new Texture();

    originalMaterial.map = diffuseMap;

    const nextMaterial = createOutfitIdMapMaterial(
      originalMaterial,
      outfitIdMap,
      outfitColorConfig.contact,
    );

    expect(nextMaterial).toBeInstanceOf(MeshStandardMaterial);
    expect(nextMaterial).not.toBe(originalMaterial);
    expect(getSingleMaterial(nextMaterial).map).not.toBe(diffuseMap);
  });

  it('인스턴스별 다른 outfit 색상 구성을 uniform에 반영할 수 있다', () => {
    const originalMaterial = new MeshStandardMaterial({ color: '#ffffff' });
    const outfitIdMap = new Texture();

    const heroMaterial = getSingleMaterial(
      createOutfitIdMapMaterial(originalMaterial, outfitIdMap, outfitColorConfig.main),
    );
    const contactMaterial = getSingleMaterial(
      createOutfitIdMapMaterial(originalMaterial, outfitIdMap, outfitColorConfig.contact),
    );
    const heroShader = createShaderFixture();
    const contactShader = createShaderFixture();

    heroMaterial.onBeforeCompile?.(heroShader, {} as never);
    contactMaterial.onBeforeCompile?.(contactShader, {} as never);

    expect(heroShader.uniforms.uColorOuter?.value.getHexString()).toBe(
      normalizeHex(outfitColorConfig.main.outer),
    );
    expect(heroShader.uniforms.uColorPants?.value.getHexString()).toBe(
      normalizeHex(outfitColorConfig.main.pants),
    );
    expect(contactShader.uniforms.uColorOuter?.value.getHexString()).toBe(
      normalizeHex(outfitColorConfig.contact.outer),
    );
    expect(contactShader.uniforms.uColorPants?.value.getHexString()).toBe(
      normalizeHex(outfitColorConfig.contact.pants),
    );
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
  material.map = new Texture();

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

/**
 * 셰이더 주입 결과를 확인하기 위한 최소 shader fixture를 생성합니다.
 */
const createShaderFixture = () =>
  ({
    fragmentShader: 'void main() { #include <color_fragment> }',
    uniforms: {},
  }) as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
