'use client';

import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import type { Group, Texture } from 'three';

import { applyOrmToMaterial, isMeshNode, prepareOrmTexture } from '@/shared/lib/three/orm-material';

type ScenePropPath = '/models/guitar.glb' | '/models/sofa.glb' | '/models/table.glb';

export type PropsOrmTextures = Readonly<{
  room: Texture;
}>;

const PROP_ORM_TEXTURE_PATHS = {
  room: '/textures/room_ORM.png',
} as const;

const ROOM_ORM_EXCLUDED_MESH_NAMES = new Set(['frame_screen']);

/**
 * 소품 GLB에 사용할 ORM texture를 로드하고 공통 설정을 적용합니다.
 */
export const usePropsMaterials = (): PropsOrmTextures => {
  const room = useTexture(PROP_ORM_TEXTURE_PATHS.room);

  return useMemo(() => {
    const textures = { room } as const;
    prepareOrmTexture(textures.room);

    return textures;
  }, [room]);
};

/**
 * 소품 clone scene에 path 기준 ORM texture를 1회 주입합니다.
 */
export const applyPropsMaterials = (
  scene: Group,
  _path: ScenePropPath,
  textures: PropsOrmTextures,
): void => {
  prepareOrmTexture(textures.room);

  scene.traverse(node => {
    if (!isMeshNode(node)) return;
    if (ROOM_ORM_EXCLUDED_MESH_NAMES.has(node.name)) return;

    applyOrmToMaterial(node.material, textures.room);
  });
};
