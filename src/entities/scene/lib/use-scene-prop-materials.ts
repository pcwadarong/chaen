'use client';

import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import { type Group, MeshStandardMaterial, type Texture } from 'three';

import { applyOrmToMaterial, isMeshNode, prepareOrmTexture } from '@/shared/lib/three/orm-material';

export type PropsOrmTextures = Readonly<{
  room: Texture;
}>;

const PROP_ORM_TEXTURE_PATHS = {
  room: '/textures/room_ORM.png',
} as const;

const ROOM_ORM_EXCLUDED_MESH_NAMES = new Set(['frame_screen']);
const FRAME_SCREEN_MESH_NAME = 'frame_screen';

/**
 * 소품 GLB에 사용할 ORM texture를 로드하고 공통 설정을 적용합니다.
 */
export const useScenePropMaterials = (): PropsOrmTextures => {
  const room = useTexture(PROP_ORM_TEXTURE_PATHS.room);

  return useMemo(() => {
    const textures = { room } as const;
    prepareOrmTexture(textures.room);

    return textures;
  }, [room]);
};

/**
 * 소품 clone scene에 room ORM texture를 1회 주입합니다.
 */
export const applyScenePropMaterials = (scene: Group, textures: PropsOrmTextures): void => {
  scene.traverse(node => {
    if (!isMeshNode(node)) return;
    if (ROOM_ORM_EXCLUDED_MESH_NAMES.has(node.name)) return;

    applyOrmToMaterial(node.material, textures.room);
  });
};

/**
 * 액자 화면 mesh에 선택 이미지를 map으로 연결하거나 제거합니다.
 * frame_screen은 ORM 제외 대상으로 유지하고, 여기서만 별도 색 텍스처를 주입합니다.
 */
export const applyFrameScreenTexture = (scene: Group, texture: Texture | null): void => {
  scene.traverse(node => {
    if (!isMeshNode(node)) return;
    if (node.name !== FRAME_SCREEN_MESH_NAME) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];

    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;

      material.map = texture;
      material.color.set(texture ? '#ffffff' : '#f4f1ff');
      material.needsUpdate = true;
    }
  });
};
