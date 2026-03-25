import type { AnimationClip, Group, Material, Object3D } from 'three';

type CharacterGltfLike = Readonly<{
  animations: AnimationClip[];
  scene: Group;
}>;

/**
 * 캐릭터 GLTF 씬 트리를 순회하면서 노드와 애니메이션 구조를 개발 환경에서만 출력합니다.
 */
export const analyzeCharacterGltf = (gltf: CharacterGltfLike): void => {
  if (process.env.NODE_ENV !== 'development') return;

  gltf.scene.traverse(node => {
    console.info(formatNodeLog(node));
  });

  console.info(`[ANIMATIONS] ${gltf.animations.map(animation => animation.name).join(', ')}`);
};

/**
 * 순회한 Object3D를 디버깅 로그 포맷으로 변환합니다.
 */
const formatNodeLog = (node: Object3D): string => {
  const nodeType = getNodeType(node);
  const materialName = getMaterialName(node);

  return `[${nodeType}] ${node.name || '(unnamed)'} | material: ${materialName}`;
};

/**
 * Object3D의 종류를 분석용 문자열로 변환합니다.
 */
const getNodeType = (node: Object3D): 'MESH' | 'BONE' | 'NODE' => {
  if ('isMesh' in node && node.isMesh) return 'MESH';
  if ('isBone' in node && node.isBone) return 'BONE';

  return 'NODE';
};

/**
 * Mesh material 이름을 안전하게 문자열로 변환합니다.
 */
const getMaterialName = (node: Object3D): string => {
  if (!('material' in node)) return '-';

  const material = node.material as Material | Material[] | null | undefined;

  if (!material) return '-';
  if (Array.isArray(material)) {
    return material.map(item => item.name || '(unnamed)').join(', ');
  }

  return material.name || '(unnamed)';
};
