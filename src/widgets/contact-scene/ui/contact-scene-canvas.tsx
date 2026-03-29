'use client';

import { Canvas, useThree } from '@react-three/fiber';
import React, { Suspense, useEffect } from 'react';

import type { SceneBreakpoint } from '@/entities/scene/model/breakpointConfig';
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
const CONTACT_SCENE_LOOK_AT: Vector3Tuple = [-3.5, 0, 0];

type ContactCameraPreset = Readonly<{
  lookAt: Vector3Tuple;
  position: Vector3Tuple;
}>;

const CONTACT_CAMERA_PRESETS = {
  desktopLarge: {
    lookAt: CONTACT_SCENE_LOOK_AT,
    position: [0, 1, 10],
  },
  desktopSmall: {
    lookAt: CONTACT_SCENE_LOOK_AT,
    position: [0, 1, 12],
  },
} as const satisfies Readonly<Record<'desktopLarge' | 'desktopSmall', ContactCameraPreset>>;

/**
 * 현재 desktop breakpoint에 맞는 contact 카메라 preset을 반환합니다.
 */
const getContactCameraPreset = (currentBP: SceneBreakpoint): ContactCameraPreset =>
  currentBP === 3 ? CONTACT_CAMERA_PRESETS.desktopSmall : CONTACT_CAMERA_PRESETS.desktopLarge;

/** contact scene의 카메라를 좌측으로 옮겨 캐릭터가 우측 프레임에 오도록 정렬합니다. */
const ContactSceneCameraRig = ({ currentBP }: { readonly currentBP: SceneBreakpoint }) => {
  const { camera } = useThree();
  const cameraPreset = getContactCameraPreset(currentBP);

  useEffect(() => {
    camera.position.set(
      cameraPreset.position[0],
      cameraPreset.position[1],
      cameraPreset.position[2],
    );
    camera.lookAt(...cameraPreset.lookAt);
    camera.updateMatrixWorld();
  }, [camera, cameraPreset]);

  return null;
};

/** 데스크탑 contact 영역의 정적 3D 씬입니다. hero 초기 카메라 위치를 그대로 사용합니다. */
export const ContactSceneCanvas = ({ currentBP }: { readonly currentBP: SceneBreakpoint }) => {
  const cameraPreset = getContactCameraPreset(currentBP);

  return (
    <Canvas
      camera={{
        far: HOME_HERO_CAMERA_FAR,
        fov: CONTACT_SCENE_CAMERA_FOV,
        near: HOME_HERO_CAMERA_NEAR,
        position: cameraPreset.position,
      }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      shadows
    >
      <ContactSceneCameraRig currentBP={currentBP} />
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
};
