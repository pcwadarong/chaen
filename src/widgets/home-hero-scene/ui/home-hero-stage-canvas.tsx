'use client';

import { ContactShadows, Float, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { RefObject } from 'react';

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
    <HomeHeroSceneObjects />
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
 * 배경, 좌우 박스, 중앙 플랫폼, 노트북 오브젝트를 포함한 스테이지 구성을 렌더링합니다.
 */
const HomeHeroSceneObjects = () => (
  <group position={[0, -2.4, 0]}>
    <mesh receiveShadow position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color={sceneColors.floor} />
    </mesh>

    <RoundedBox args={[2.8, 2.5, 2.8]} position={[-5.2, 0.85, -1.35]} radius={0.34} smoothness={5}>
      <meshStandardMaterial color={sceneColors.sideBlock} metalness={0.08} roughness={0.86} />
    </RoundedBox>

    <RoundedBox args={[4.6, 3.6, 4.2]} position={[0, 1.4, -0.2]} radius={0.44} smoothness={5}>
      <meshStandardMaterial color={sceneColors.centerBlock} metalness={0.12} roughness={0.72} />
    </RoundedBox>

    <RoundedBox args={[2.7, 2.2, 2.7]} position={[5.1, 0.7, -1.2]} radius={0.34} smoothness={5}>
      <meshStandardMaterial color={sceneColors.sideBlock} metalness={0.08} roughness={0.86} />
    </RoundedBox>

    <Float floatIntensity={0.22} rotationIntensity={0.08} speed={1.15}>
      <group position={[0.1, 3.65, 1.45]} rotation={[-0.04, Math.PI, 0]}>
        <RoundedBox args={[2.9, 1.8, 0.16]} castShadow radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={sceneColors.monitorFrame}
            metalness={0.24}
            roughness={0.34}
          />
        </RoundedBox>
        <RoundedBox args={[2.52, 1.42, 0.04]} position={[0, 0.02, 0.1]} radius={0.06}>
          <meshStandardMaterial
            color={sceneColors.monitorScreen}
            emissive={sceneColors.accent}
            emissiveIntensity={0.18}
            metalness={0.04}
            roughness={0.16}
          />
        </RoundedBox>
        <RoundedBox args={[0.34, 1.1, 0.2]} position={[0, -1.18, 0]} radius={0.08} smoothness={4}>
          <meshStandardMaterial color={sceneColors.monitorFrame} roughness={0.48} />
        </RoundedBox>
        <RoundedBox
          args={[1.5, 0.14, 0.86]}
          position={[0, -1.78, 0.2]}
          radius={0.08}
          smoothness={4}
        >
          <meshStandardMaterial color={sceneColors.monitorFrame} roughness={0.48} />
        </RoundedBox>
      </group>
    </Float>

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
  platform: '#e4e7ec',
  sideBlock: '#c7ced8',
  centerBlock: '#dbe1e8',
  detailBlock: '#a8b1bd',
  monitorFrame: '#212936',
  monitorScreen: '#f3f5f7',
  keyboardPlate: '#dfe5eb',
  accent: '#7f8896',
  detailGlow: '#8d96a3',
  ambientLight: '#ffffff',
  keyLight: '#ffffff',
  fillLight: '#d2d8e1',
  shadow: '#202734',
} as const;
