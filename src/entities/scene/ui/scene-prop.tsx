'use client';

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

type ScenePropProps = Readonly<{
  path: '/models/guitar.glb' | '/models/sofa.glb' | '/models/table.glb';
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
  const object = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

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
