'use client';

import { ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { type RefObject, Suspense } from 'react';

import { Character } from '@/entities/character/ui/character';
import { useHomeHeroSceneTransition } from '@/widgets/home-hero-scene/ui/use-home-hero-scene-transition';

type HomeHeroStageCanvasProps = {
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

/**
 * 홈 히어로 영역의 정적 3D 스테이지를 구성합니다.
 */
export const HomeHeroStageCanvas = ({ triggerRef, webUiRef }: HomeHeroStageCanvasProps) => (
  <Canvas
    camera={cameraSettings}
    dpr={[1, 1.75]}
    gl={{ alpha: false, antialias: true }}
    onCreated={({ gl }) => {
      gl.domElement.id = 'three-canvas';
    }}
  >
    <color args={[sceneColors.background]} attach="background" />
    <fog args={[sceneColors.fog, 12, 28]} attach="fog" />
    <ambientLight color={sceneColors.ambientLight} intensity={1.25} />
    <directionalLight
      castShadow
      color={sceneColors.keyLight}
      intensity={1.95}
      position={[7.5, 9.2, 7.4]}
      shadow-bias={-0.0002}
      shadow-mapSize-height={1024}
      shadow-mapSize-width={1024}
    />
    <directionalLight color={sceneColors.fillLight} intensity={0.8} position={[-7.4, 4.8, -5.4]} />
    <HomeHeroCameraRig triggerRef={triggerRef} webUiRef={webUiRef} />
    <Suspense fallback={null}>
      <HomeHeroSceneObjects />
    </Suspense>
  </Canvas>
);

/**
 * 스크롤 진행도에 따라 기본 카메라를 모니터 포커스 시점으로 이동시키는 리그입니다.
 */
const HomeHeroCameraRig = ({
  triggerRef,
  webUiRef,
}: {
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
}) => {
  const { pivotRef, cameraMountRef } = useHomeHeroSceneTransition({ triggerRef, webUiRef });

  return (
    <group ref={pivotRef}>
      <group ref={cameraMountRef} />
    </group>
  );
};

/**
 * 캐릭터와 바닥, 그림자만 포함한 홈 전용 스테이지 구성을 렌더링합니다.
 */
const HomeHeroSceneObjects = () => (
  <group position={[0, -2.4, 0]}>
    <Character instance="main" position={[0, 0, 0]} />
    <Character instance="contact" position={[0, 0, -10]} />

    <mesh receiveShadow position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color={sceneColors.floor} />
    </mesh>

    <ContactShadows
      blur={3.2}
      color={sceneColors.shadow}
      far={8}
      opacity={0.32}
      position={[0, -0.74, 0]}
      resolution={1024}
      scale={12}
    />
  </group>
);

const cameraSettings = {
  fov: 24,
  near: 0.1,
  far: 60,
  position: [0, 4.4, 18.5],
} as const;

const sceneColors = {
  background: '#d7dbe2',
  fog: '#edf0f4',
  floor: '#cfd4dc',
  ambientLight: '#ffffff',
  keyLight: '#ffffff',
  fillLight: '#d2d8e1',
  shadow: '#202734',
} as const;
