'use client';

import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import { Color, type Group, MeshStandardMaterial, type Texture } from 'three';

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
const LAPTOP_SCREEN_MESH_NAME = 'laptop_screen';
const MONITOR_SCREEN_FALLBACK_COLOR = new Color('#03060d');
const MONITOR_SCREEN_TINT_COLOR = new Color('#ffffff');

type ApplyCharacterScreenTextureParams = Readonly<{
  opacity: number;
  texture: Texture | null;
}>;

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

    if (HAIR_MESH_NAMES.has(node.name)) applyOrmToMaterial(node.material, textures.hair);
    //TODO: 알파 정도 조절해서 { useAlphaMap: true } 활성화
  });
};

/**
 * 캐릭터 노트북 화면 mesh에 현재 monitor texture와 표시 강도를 반영합니다.
 * 실제 액정 면은 항상 불투명하게 유지하고, opacity 값은 texture가 얼마나 켜져 보이는지만 제어합니다.
 */
export const applyCharacterScreenTexture = (
  scene: Group,
  { opacity, texture }: ApplyCharacterScreenTextureParams,
): void => {
  scene.traverse(node => {
    if (!isMeshNode(node)) return;
    if (node.name !== LAPTOP_SCREEN_MESH_NAME) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];

    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;

      material.map = texture;
      if (texture) {
        material.color.copy(MONITOR_SCREEN_FALLBACK_COLOR).lerp(MONITOR_SCREEN_TINT_COLOR, opacity);
      } else {
        material.color.copy(MONITOR_SCREEN_FALLBACK_COLOR);
      }

      material.emissive.copy(texture ? MONITOR_SCREEN_TINT_COLOR : MONITOR_SCREEN_FALLBACK_COLOR);
      material.emissiveIntensity = texture ? opacity * 0.16 : 0;
      material.opacity = 1;
      material.transparent = false;
      material.needsUpdate = true;
    }
  });
};
