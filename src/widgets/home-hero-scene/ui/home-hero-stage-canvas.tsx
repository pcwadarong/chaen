'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { type RefObject, Suspense } from 'react';

import { Character } from '@/entities/character/ui/character';
import { SceneProp } from '@/entities/scene/ui/scene-prop';
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
    dpr={[1, 5]}
    gl={{ alpha: false, antialias: true }}
    shadows
    onCreated={({ gl }) => {
      gl.domElement.id = 'three-canvas';
      gl.domElement.style.touchAction = 'none';
    }}
  >
    <color args={['#5d5bff']} attach="background" />
    <HomeHeroLights />
    <HomeHeroCameraRig triggerRef={triggerRef} webUiRef={webUiRef} />
    <Suspense fallback={null}>
      <HomeHeroSceneObjects />
    </Suspense>
  </Canvas>
);

/**
 * 홈 히어로 장면의 기본 조명을 역할별로 분리합니다.
 */
const HomeHeroLights = () => (
  <>
    <ambientLight color="#f8f4ff" intensity={1.5} />
    <directionalLight castShadow color="#fff8f0" intensity={2.2} position={[1.5, 5.0, 8.0]} />
    <pointLight
      color="#fff8e8"
      decay={1.5}
      distance={15}
      intensity={4}
      position={[1.1, 1.9, 7.2]}
    />
  </>
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
  const { pivotRef, cameraMountRef, isScrollDriven } = useHomeHeroSceneTransition({
    triggerRef,
    webUiRef,
  });

  return (
    <group ref={pivotRef}>
      <group ref={cameraMountRef} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enabled={!isScrollDriven}
        makeDefault
        target={[0, 1.8, 0]}
      />
    </group>
  );
};

/**
 * 캐릭터와 핵심 소품을 포함한 홈 전용 스테이지 구성을 렌더링합니다.
 */
const HomeHeroSceneObjects = () => (
  <group position={[0, -2.4, 0]}>
    <Character instance="main" position={[0, 0, 0]} />
    <SceneProp path="/models/sofa.glb" position={[0, 0, -2]} />
    <SceneProp path="/models/bass.glb" position={[-3, 0, 0]} />
    <SceneProp path="/models/table.glb" position={[3, 0, 0]} />

    <mesh receiveShadow position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <shadowMaterial color={'#322ea5'} opacity={0.42} transparent />
    </mesh>
  </group>
);

const cameraSettings = {
  fov: 24,
  near: 0.1,
  far: 60,
  position: [0, 4.4, 18.5],
} as const;
