import type { Group, Object3D } from 'three';

const HOME_HERO_CLOSEUP_HIDDEN_COSTUME_NAMES = new Set(['inner', 'outer']);

/**
 * 홈 히어로 클로즈업 구간에서 가릴 의상 mesh만 visible 상태를 토글합니다.
 */
export const setHomeHeroCostumeVisibility = (scene: Group, visible: boolean) => {
  scene.traverse(node => {
    if (!isMeshNode(node)) return;
    if (!HOME_HERO_CLOSEUP_HIDDEN_COSTUME_NAMES.has(node.name)) return;

    node.visible = visible;
  });
};

/**
 * traverse 중 만나는 Object3D를 Mesh-like 노드로 안전하게 좁힙니다.
 */
const isMeshNode = (node: Object3D): node is Object3D & { visible: boolean } =>
  'isMesh' in node && node.isMesh === true;
