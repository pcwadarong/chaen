import type { Group, Material, Mesh, Object3D, Texture } from 'three';
import { Color, MeshStandardMaterial } from 'three';

export const CHARACTER_OUTFIT_COLOR_CONFIG = {
  contact: {
    outer: '#E7B749',
    pants: '#929569',
    ribon: '#B04747',
  },
  main: {
    outer: '#FF6F0F',
    pants: '#00A05B',
    ribon: '#B04747',
  },
} as const;

const CHARACTER_TINTS = {
  hair: '#3D2B1F',
} as const;

export type CharacterOutfitColors =
  (typeof CHARACTER_OUTFIT_COLOR_CONFIG)[keyof typeof CHARACTER_OUTFIT_COLOR_CONFIG];

type CharacterMaterialOptions = Readonly<{
  instance: 'contact' | 'main';
  outfitIdMap: Texture;
  outfitColors: CharacterOutfitColors;
}>;

type MaterialCompileShader = Parameters<NonNullable<MeshStandardMaterial['onBeforeCompile']>>[0];

const CONTACT_HIDDEN_MESH_NAMES = new Set(['laptop', 'monitor']);

/**
 * 캐릭터 GLB 씬을 복제한 뒤 인스턴스별 초기 상태를 적용합니다.
 */
export const prepareCharacterInstance = (
  sourceScene: Group,
  { instance, outfitColors, outfitIdMap }: CharacterMaterialOptions,
): Group => {
  const clonedScene = sourceScene.clone(true) as Group;

  clonedScene.traverse(node => {
    if (!isMeshNode(node)) return;

    if (node.name === 'heart') {
      node.visible = false;
      return;
    }

    if (instance === 'contact' && CONTACT_HIDDEN_MESH_NAMES.has(node.name)) {
      node.visible = false;
      return;
    }

    if (node.name === 'outfit') {
      node.material = createOutfitIdMapMaterial(node.material, outfitIdMap, outfitColors);
      return;
    }

    if (node.name === 'hair') {
      node.material = createTintedMaterial(node.material, CHARACTER_TINTS.hair);
    }
  });

  return clonedScene;
};

/**
 * outfit ID 맵 셰이더에 사용하는 목표 색상 구성을 노출합니다.
 */
export const outfitColorConfig = CHARACTER_OUTFIT_COLOR_CONFIG;

/**
 * mesh material을 복제하고 지정한 tint color를 적용합니다.
 */
const createTintedMaterial = (
  material: Material | Material[],
  color: (typeof CHARACTER_TINTS)[keyof typeof CHARACTER_TINTS],
): Material | Material[] => {
  if (Array.isArray(material)) {
    return material.map(item => applyMaterialColor(item.clone(), color));
  }

  return applyMaterialColor(material.clone(), color);
};

/**
 * color 속성이 있는 material에만 tint color를 반영합니다.
 */
const applyMaterialColor = (material: Material, color: string): Material => {
  if ('color' in material && material.color instanceof Color) {
    material.color.set(color);
  }

  return material;
};

/**
 * 테스트와 후속 로직에서 사용하는 캐릭터 tint 값을 노출합니다.
 */
export const characterTintMap = CHARACTER_TINTS;

/**
 * ID 맵을 기반으로 outfit 영역별 목표 색상을 적용하는 material을 생성합니다.
 */
export const createOutfitIdMapMaterial = (
  material: Material | Material[],
  outfitIdMap: Texture,
  colors: CharacterOutfitColors,
): Material | Material[] => {
  if (Array.isArray(material)) {
    return material.map(item => createOutfitIdMapMaterial(item, outfitIdMap, colors) as Material);
  }

  const nextMaterial =
    material instanceof MeshStandardMaterial
      ? cloneMeshStandardMaterial(material)
      : new MeshStandardMaterial();

  nextMaterial.onBeforeCompile = (shader: MaterialCompileShader) => {
    shader.uniforms.uIdMap = { value: outfitIdMap };
    shader.uniforms.uColorOuter = { value: new Color(colors.outer) };
    shader.uniforms.uColorPants = { value: new Color(colors.pants) };
    shader.uniforms.uColorRibon = { value: new Color(colors.ribon) };

    shader.fragmentShader = `
      uniform sampler2D uIdMap;
      uniform vec3 uColorOuter;
      uniform vec3 uColorPants;
      uniform vec3 uColorRibon;
    ${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>

      vec4 idColor = texture2D(uIdMap, vUv);

      if (idColor.r > 0.9) {
        diffuseColor.rgb = uColorOuter;
      } else if (idColor.g > 0.9) {
        diffuseColor.rgb = uColorPants;
      } else if (idColor.b > 0.9) {
        diffuseColor.rgb = uColorRibon;
      }
      `,
    );
  };
  nextMaterial.needsUpdate = true;

  return nextMaterial;
};

/**
 * 기존 MeshStandardMaterial의 텍스처 슬롯까지 분리된 새 material을 생성합니다.
 */
const cloneMeshStandardMaterial = (material: MeshStandardMaterial): MeshStandardMaterial => {
  const nextMaterial = material.clone();

  nextMaterial.map = material.map?.clone() ?? null;
  nextMaterial.normalMap = material.normalMap?.clone() ?? null;
  nextMaterial.aoMap = material.aoMap?.clone() ?? null;
  nextMaterial.roughnessMap = material.roughnessMap?.clone() ?? null;
  nextMaterial.metalnessMap = material.metalnessMap?.clone() ?? null;
  nextMaterial.alphaMap = material.alphaMap?.clone() ?? null;

  return nextMaterial;
};

/**
 * 테스트용으로 이름 기준 mesh를 조회합니다.
 */
export const findCharacterMesh = (scene: Group, name: string): Mesh | null => {
  let targetMesh: Mesh | null = null;

  scene.traverse(node => {
    if (targetMesh || !isMeshNode(node)) return;
    if (node.name !== name) return;

    targetMesh = node;
  });

  return targetMesh;
};

/**
 * traverse 중 만나는 Object3D를 Mesh로 안전하게 좁힙니다.
 */
const isMeshNode = (node: Object3D): node is Mesh => 'isMesh' in node && node.isMesh === true;
