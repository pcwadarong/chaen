'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { type RefObject, Suspense, useMemo, useState } from 'react';

import type { SceneBreakpoint } from '@/entities/scene/model/breakpointConfig';
import { SceneProp } from '@/entities/scene/ui/scene-prop';
import { useAllowCanvasContextMenu } from '@/widgets/home-hero-scene/model/use-allow-canvas-context-menu';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';
import { useHomeHeroSceneTransition } from '@/widgets/home-hero-scene/model/use-home-hero-scene-transition';
import { HomeHeroCharacter } from '@/widgets/home-hero-scene/ui/home-hero-character';
import {
  getHomeHeroSceneLayout,
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type HomeHeroSceneLayout,
} from '@/widgets/home-hero-scene/ui/home-hero-scene-layout';

type HomeHeroStageCanvasProps = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

/**
 * 홈 히어로 영역의 breakpoint 대응 3D 스테이지를 구성합니다.
 */
export const HomeHeroStageCanvas = ({
  blackoutOverlayRef,
  triggerRef,
  webUiRef,
}: HomeHeroStageCanvasProps) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const { currentBP, sceneMode } = useBreakpoint({
    isScrolling,
  });
  useAllowCanvasContextMenu(canvasElement);
  const sceneLayout = useMemo(
    () =>
      getHomeHeroSceneLayout({
        currentBP,
      }),
    [currentBP],
  );

  return (
    <Canvas
      camera={{
        far: HOME_HERO_CAMERA_FAR,
        fov: sceneLayout.camera.fov,
        near: HOME_HERO_CAMERA_NEAR,
        position: sceneLayout.camera.position,
      }}
      dpr={[1, 5]}
      gl={{ alpha: false, antialias: true }}
      shadows
      onCreated={({ gl }) => {
        gl.domElement.id = 'three-canvas';
        gl.domElement.style.touchAction = 'none';
        setCanvasElement(gl.domElement);
      }}
    >
      <color args={['#5d5bff']} attach="background" />
      <HomeHeroLights />
      <HomeHeroCameraRig
        blackoutOverlayRef={blackoutOverlayRef}
        currentBP={currentBP}
        onScrollStateChange={setIsScrolling}
        sceneLayout={sceneLayout}
        sceneMode={sceneMode}
        triggerRef={triggerRef}
        webUiRef={webUiRef}
      />
      <Suspense fallback={null}>
        <HomeHeroSceneObjects sceneLayout={sceneLayout} />
      </Suspense>
    </Canvas>
  );
};

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
 * breakpoint와 스크롤 상태에 따라 기본 카메라와 Orbit 제어를 전환합니다.
 */
const HomeHeroCameraRig = ({
  blackoutOverlayRef,
  currentBP,
  onScrollStateChange,
  sceneLayout,
  sceneMode,
  triggerRef,
  webUiRef,
}: {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly currentBP: SceneBreakpoint;
  readonly onScrollStateChange: (isScrolling: boolean) => void;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneMode: 'desktop' | 'mobile';
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
}) => {
  const { isScrollDriven } = useHomeHeroSceneTransition({
    blackoutOverlayRef,
    onScrollStateChange,
    sceneLayout,
    sceneMode,
    triggerRef,
    webUiRef,
  });

  return (
    <OrbitControls
      enablePan={false}
      enableRotate
      enableZoom
      enabled={sceneMode === 'mobile' || !isScrollDriven}
      key={`${sceneMode}-${currentBP}`}
      makeDefault
      maxAzimuthAngle={sceneLayout.camera.maxAzimuthAngle}
      maxDistance={sceneLayout.camera.maxDistance}
      maxPolarAngle={sceneLayout.camera.maxPolarAngle}
      minAzimuthAngle={sceneLayout.camera.minAzimuthAngle}
      minDistance={sceneLayout.camera.minDistance}
      minPolarAngle={sceneLayout.camera.minPolarAngle}
      target={sceneLayout.camera.lookAt}
    />
  );
};

/**
 * 캐릭터와 핵심 소품을 포함한 홈 전용 스테이지 구성을 breakpoint 기준으로 렌더링합니다.
 */
const HomeHeroSceneObjects = ({ sceneLayout }: { readonly sceneLayout: HomeHeroSceneLayout }) => (
  <group position={[0, -2.4, 0]}>
    <HomeHeroCharacter instance="main" position={[0, 0, 0]} />
    <SceneProp path="/models/sofa.glb" position={[0, 0, -1]} />
    <SceneProp
      path="/models/bass.glb"
      position={[...sceneLayout.bassPosition]}
      rotation={[...sceneLayout.bassRotation]}
    />
    <SceneProp
      path="/models/table.glb"
      position={[...sceneLayout.tablePosition]}
      rotation={[...sceneLayout.tableRotation]}
    />

    <mesh receiveShadow position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <shadowMaterial color={'#322ea5'} opacity={0.42} transparent />
    </mesh>
  </group>
);
