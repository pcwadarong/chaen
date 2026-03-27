'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import {
  Box3,
  type Group,
  type Material,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three';

import {
  applyFrameScreenTexture,
  applyScenePropMaterials,
  useScenePropMaterials,
} from '@/entities/scene/lib/use-scene-prop-materials';
import { isMeshNode } from '@/shared/lib/three/orm-material';

type ScenePropProps = Readonly<{
  frameScreenImageSrc?: string | null;
  path: '/models/bass.glb' | '/models/sofa.glb' | '/models/table.glb';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}>;

/**
 * 홈 씬에서 사용하는 단일 GLB 소품을 위치/회전/스케일과 함께 렌더링합니다.
 */
export const SceneProp = ({
  frameScreenImageSrc = null,
  path,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: ScenePropProps) => {
  const gltf = useGLTF(path);
  const ormTextures = useScenePropMaterials();
  const [frameScreenTexture, setFrameScreenTexture] = useState<Texture | null>(null);
  const object = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse(node => {
      if (!isMeshNode(node)) return;

      node.castShadow = true;
      node.receiveShadow = true;

      if (node.name === 'frame_screen') {
        node.material = cloneScenePropMaterial(node.material);
      }
    });

    applyScenePropMaterials(clonedScene, ormTextures);
    groundSceneProp(clonedScene);

    return clonedScene;
  }, [gltf.scene, ormTextures]);

  useEffect(() => {
    setFrameScreenTexture(null);

    if (!frameScreenImageSrc) return;

    let isActive = true;
    let loadedTexture: Texture | null = null;
    const textureLoader = new TextureLoader();

    textureLoader.setCrossOrigin('anonymous');
    textureLoader.load(
      frameScreenImageSrc,
      nextTexture => {
        if (!isActive) {
          nextTexture.dispose();
          return;
        }

        nextTexture.colorSpace = SRGBColorSpace;
        nextTexture.flipY = false;
        nextTexture.needsUpdate = true;
        loadedTexture = nextTexture;
        setFrameScreenTexture(nextTexture);
      },
      undefined,
      () => {
        if (!isActive) return;

        setFrameScreenTexture(null);
      },
    );

    return () => {
      isActive = false;

      if (loadedTexture) {
        loadedTexture.dispose();
      }
    };
  }, [frameScreenImageSrc]);

  useEffect(() => {
    applyFrameScreenTexture(object, frameScreenTexture);
  }, [frameScreenTexture, object]);

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
 * frame_screen처럼 런타임에 map을 교체할 mesh는 material을 복제해 원본 GLTF 재질과 분리합니다.
 */
const cloneScenePropMaterial = (material: Material | Material[]): Material | Material[] => {
  if (Array.isArray(material)) {
    return material.map(item => item.clone());
  }

  return material.clone();
};

/**
 * 소품 clone의 최저점을 원점에 맞춰, scene 위치가 곧 바닥 기준이 되게 정렬합니다.
 */
const groundSceneProp = (scene: Group) => {
  const bounds = new Box3().setFromObject(scene);

  if (!Number.isFinite(bounds.min.y)) return;

  scene.position.y -= bounds.min.y;
};
