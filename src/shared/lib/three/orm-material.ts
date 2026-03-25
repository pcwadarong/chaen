import {
  type Material,
  type Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  type Object3D,
  type Texture,
} from 'three';

type ApplyOrmMaterialOptions = Readonly<{
  useAlphaMap?: boolean;
}>;

/**
 * ORM texture를 glTF material에 맞는 색 공간과 UV 방향으로 정리합니다.
 */
export const prepareOrmTexture = (texture: Texture): void => {
  texture.colorSpace = NoColorSpace;
  texture.flipY = false;
};

/**
 * material 하나 또는 배열에 ORM texture를 공통 규칙으로 연결합니다.
 */
export const applyOrmToMaterial = (
  material: Material | Material[],
  texture: Texture,
  options?: ApplyOrmMaterialOptions,
): void => {
  if (Array.isArray(material)) {
    material.forEach(item => {
      applyOrmToSingleMaterial(item, texture, options);
    });
    return;
  }

  applyOrmToSingleMaterial(material, texture, options);
};

/**
 * 순회 중 만나는 Object3D를 Mesh로 안전하게 좁힙니다.
 */
export const isMeshNode = (node: Object3D): node is Mesh =>
  'isMesh' in node && node.isMesh === true;

/**
 * MeshStandardMaterial에만 ORM map을 실제로 연결합니다.
 */
const applyOrmToSingleMaterial = (
  material: Material,
  texture: Texture,
  options?: ApplyOrmMaterialOptions,
): void => {
  if (!(material instanceof MeshStandardMaterial)) return;

  material.aoMap = texture;
  material.roughnessMap = texture;
  material.metalnessMap = texture;
  material.roughness = 1;
  material.metalness = 1;

  if (options?.useAlphaMap) {
    material.alphaMap = texture;
    material.transparent = true;
  }

  material.needsUpdate = true;
};
