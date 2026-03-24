import type { Group, Material, Mesh, Object3D } from 'three';
import { Color } from 'three';

const CHARACTER_TINTS = {
  hair: '#3D2B1F',
  outfit: '#A8C5E8',
} as const;

/**
 * 캐릭터 GLB 씬을 복제한 뒤 인스턴스별 초기 상태를 적용합니다.
 */
export const prepareCharacterInstance = (sourceScene: Group): Group => {
  const clonedScene = sourceScene.clone(true) as Group;

  clonedScene.traverse(node => {
    if (!isMeshNode(node)) return;

    if (node.name === 'heart') {
      node.visible = false;
      return;
    }

    if (node.name === 'outfit') {
      node.material = createTintedMaterial(node.material, CHARACTER_TINTS.outfit);
      return;
    }

    if (node.name === 'hair') {
      node.material = createTintedMaterial(node.material, CHARACTER_TINTS.hair);
    }
  });

  return clonedScene;
};

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
