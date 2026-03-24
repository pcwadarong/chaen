'use client';

import { ContactShadows, OrbitControls } from '@react-three/drei';
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
    onCreated={({ gl }) => {
      gl.domElement.id = 'three-canvas';
      gl.domElement.style.touchAction = 'none';
    }}
  >
    <color args={[sceneColors.background]} attach="background" />
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
    <SceneProp path="/models/guitar.glb" position={[-1, 0.5, 0.4]} />
    <SceneProp path="/models/table.glb" position={[1, 0.5, 0.25]} />

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
  background: '#604DFF',
  floor: '#604DFF',
  ambientLight: '#E5EEFF',
  keyLight: '#ffffff',
  fillLight: '#FF1089',
  shadow: '#202734',
} as const;
