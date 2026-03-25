'use client';

import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import type { Group, Texture } from 'three';

import { applyOrmToMaterial, isMeshNode, prepareOrmTexture } from '@/shared/lib/three/orm-material';

export type CharacterOrmTextures = Readonly<{
  gear: Texture;
  hair: Texture;
  outfit: Texture;
  skin: Texture;
}>;

const CHARACTER_ORM_TEXTURE_PATHS = {
  gear: '/textures/gear_ORM.png',
  hair: '/textures/hair_ORM.png',
  outfit: '/textures/outfit_ORM.png',
  skin: '/textures/skin_ORM.png',
} as const;

const SKIN_MESH_NAMES = new Set(['body', 'face']);
const HAIR_MESH_NAMES = new Set(['brows', 'eyebrow', 'hair']);
const OUTFIT_MESH_NAMES = new Set(['inner', 'neck_collar', 'outer', 'pants', 'ribon', 'sock']);
const GEAR_MESH_NAMES = new Set([
  'headphone_band',
  'headphone_housing',
  'headphone_pads',
  'heart',
  'laptop',
  'laptop_cover',
  'laptop_logo',
  'shoes',
  'shoes_strip',
]);

/**
 * 캐릭터에서 사용하는 ORM texture를 로드하고 GLTF 재질에 맞는 설정으로 정리합니다.
 */
export const useCharacterMaterials = (): CharacterOrmTextures => {
  const [skin, outfit, hair, gear] = useTexture([
    CHARACTER_ORM_TEXTURE_PATHS.skin,
    CHARACTER_ORM_TEXTURE_PATHS.outfit,
    CHARACTER_ORM_TEXTURE_PATHS.hair,
    CHARACTER_ORM_TEXTURE_PATHS.gear,
  ]);

  return useMemo(() => {
    const textures = { gear, hair, outfit, skin } as const;

    prepareOrmTexture(textures.skin);
    prepareOrmTexture(textures.outfit);
    prepareOrmTexture(textures.hair);
    prepareOrmTexture(textures.gear);

    return textures;
  }, [gear, hair, outfit, skin]);
};

/**
 * 캐릭터 clone scene에 body/outfit/hair ORM texture를 연결합니다.
 */
export const applyCharacterMaterials = (scene: Group, textures: CharacterOrmTextures): void => {
  prepareOrmTexture(textures.gear);
  prepareOrmTexture(textures.skin);
  prepareOrmTexture(textures.outfit);
  prepareOrmTexture(textures.hair);

  scene.traverse(node => {
    if (!isMeshNode(node)) return;

    if (SKIN_MESH_NAMES.has(node.name)) {
      applyOrmToMaterial(node.material, textures.skin);
      return;
    }

    if (GEAR_MESH_NAMES.has(node.name)) {
      applyOrmToMaterial(node.material, textures.gear);
      return;
    }

    if (OUTFIT_MESH_NAMES.has(node.name)) {
      applyOrmToMaterial(node.material, textures.outfit);
      return;
    }

    if (HAIR_MESH_NAMES.has(node.name))
      applyOrmToMaterial(node.material, textures.hair, { useAlphaMap: true });
  });
};
