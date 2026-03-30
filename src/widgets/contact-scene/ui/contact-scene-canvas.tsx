'use client';

import { Canvas, useThree } from '@react-three/fiber';
import React, { Suspense, useEffect } from 'react';

import type { SceneRenderQuality } from '@/entities/scene/model/scene-render-quality';
import {
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type Vector3Tuple,
} from '@/widgets/home-hero-scene/model/home-hero-scene-layout';
import {
  HomeHeroCharacterSeatSet,
  HomeHeroStageLights,
} from '@/widgets/home-hero-scene/ui/home-hero-scene-primitives';

const CONTACT_SCENE_CAMERA_FOV = 42;
const CONTACT_SCENE_LOOK_AT: Vector3Tuple = [0, 0, 0];
const CONTACT_SCENE_CAMERA_POSITION: Vector3Tuple = [0, 1, 10];

/** contact scene 카메라를 중앙 타깃에 고정해 레이아웃 컬럼 안에서 안정적으로 보이게 합니다. */
const ContactSceneCameraRig = () => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(
      CONTACT_SCENE_CAMERA_POSITION[0],
      CONTACT_SCENE_CAMERA_POSITION[1],
      CONTACT_SCENE_CAMERA_POSITION[2],
    );
    camera.lookAt(...CONTACT_SCENE_LOOK_AT);
    camera.updateMatrixWorld();
  }, [camera]);

  return null;
};

/** 데스크탑 contact 영역의 정적 3D 씬입니다. */
export const ContactSceneCanvas = ({
  renderQuality,
}: {
  readonly renderQuality: Pick<SceneRenderQuality, 'dpr' | 'shadows'>;
}) => (
  <Canvas
    camera={{
      far: HOME_HERO_CAMERA_FAR,
      fov: CONTACT_SCENE_CAMERA_FOV,
      near: HOME_HERO_CAMERA_NEAR,
      position: CONTACT_SCENE_CAMERA_POSITION,
    }}
    dpr={renderQuality.dpr}
    gl={{ alpha: true, antialias: true }}
    shadows={renderQuality.shadows}
  >
    <ContactSceneCameraRig />
    <HomeHeroStageLights />
    {/* 데스크탑 전용 보강 씬이라 기본 wrapper가 먼저 렌더되고, 모델 로딩 중에는 빈 캔버스로 유지합니다. */}
    <Suspense fallback={null}>
      <group position={[0, -2.4, 0]}>
        <HomeHeroCharacterSeatSet instance="contact" />
        <mesh receiveShadow position={[1.2, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 18]} />
          <shadowMaterial color={'#7d7362'} opacity={0.18} transparent />
        </mesh>
      </group>
    </Suspense>
  </Canvas>
);
