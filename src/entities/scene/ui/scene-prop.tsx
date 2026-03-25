'use client';

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, type Group } from 'three';

import {
  applyPropsMaterials,
  usePropsMaterials,
} from '@/features/character/model/use-props-materials';
import { isMeshNode } from '@/shared/lib/three/orm-material';

type ScenePropProps = Readonly<{
  path: '/models/bass.glb' | '/models/sofa.glb' | '/models/table.glb';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}>;

/**
 * 홈 씬에서 사용하는 단일 GLB 소품을 위치/회전/스케일과 함께 렌더링합니다.
 */
export const SceneProp = ({
  path,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: ScenePropProps) => {
  const gltf = useGLTF(path);
  const ormTextures = usePropsMaterials();
  const object = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse(node => {
      if (!isMeshNode(node)) return;

      node.castShadow = true;
      node.receiveShadow = true;
    });

    applyPropsMaterials(clonedScene, ormTextures);
    groundSceneProp(clonedScene);

    return clonedScene;
  }, [gltf.scene, ormTextures]);

  return (
    <primitive
      dispose={null}
      object={object}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

/**
 * 소품 clone의 최저점을 원점에 맞춰, scene 위치가 곧 바닥 기준이 되게 정렬합니다.
 */
const groundSceneProp = (scene: Group) => {
  const bounds = new Box3().setFromObject(scene);

  if (!Number.isFinite(bounds.min.y)) return;

  scene.position.y -= bounds.min.y;
};
