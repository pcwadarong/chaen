import type { Group, Material, Mesh, Object3D } from 'three';
import { Box3, Color } from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

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
  outfitColors: CharacterOutfitColors;
}>;
const CONTACT_HIDDEN_NODE_NAMES = new Set(['laptop', 'laptop_screen', 'monitor']);
const OUTFIT_MESH_COLOR_KEYS = {
  outer: 'outer',
  pants: 'pants',
  ribon: 'ribon',
} as const;

/**
 * 캐릭터 GLB 씬을 복제한 뒤 인스턴스별 초기 상태를 적용합니다.
 */
export const prepareCharacterInstance = (
  sourceScene: Group,
  { instance, outfitColors }: CharacterMaterialOptions,
): Group => {
  const clonedScene = cloneSkeleton(sourceScene) as Group;

  clonedScene.traverse(node => {
    if (instance === 'contact' && CONTACT_HIDDEN_NODE_NAMES.has(node.name)) {
      node.visible = false;
      return;
    }

    if (!isMeshNode(node)) return;

    if (node.name === 'heart') {
      node.visible = false;
      return;
    }

    if (node.name === 'hair') {
      node.material = createTintedMaterial(node.material, CHARACTER_TINTS.hair);
      return;
    }

    const outfitColorKey = OUTFIT_MESH_COLOR_KEYS[node.name as keyof typeof OUTFIT_MESH_COLOR_KEYS];

    if (outfitColorKey) {
      node.material = createTintedMaterial(node.material, outfitColors[outfitColorKey]);
      return;
    }
  });

  groundCharacterInstance(clonedScene);

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
  color: string,
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
 * 캐릭터 인스턴스의 최저점을 원점에 맞춰, scene 위치가 곧 바닥 기준이 되게 정렬합니다.
 */
const groundCharacterInstance = (scene: Group) => {
  const bounds = new Box3().setFromObject(scene);

  if (!Number.isFinite(bounds.min.y)) return;

  scene.position.y -= bounds.min.y;
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
