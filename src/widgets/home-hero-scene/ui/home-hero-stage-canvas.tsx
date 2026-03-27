'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { type RefObject, Suspense, useMemo, useState } from 'react';

import type { SceneBreakpoint } from '@/entities/scene/model/breakpointConfig';
import { SceneProp } from '@/entities/scene/ui/scene-prop';
import { SceneInteractionController } from '@/features/interaction/ui/scene-interaction-controller';
import {
  getHomeHeroSceneLayout,
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type HomeHeroSceneLayout,
} from '@/widgets/home-hero-scene/model/home-hero-scene-layout';
import { HOME_HERO_STAGE_BACKGROUND } from '@/widgets/home-hero-scene/model/home-hero-scene-theme';
import { useAllowCanvasContextMenu } from '@/widgets/home-hero-scene/model/use-allow-canvas-context-menu';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';
import { useHomeHeroSceneTransition } from '@/widgets/home-hero-scene/model/use-home-hero-scene-transition';
import {
  HomeHeroCharacterSeatSet,
  HomeHeroStageLights,
} from '@/widgets/home-hero-scene/ui/home-hero-scene-primitives';

type HomeHeroStageCanvasProps = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly interactionDisabledProgressThreshold?: number;
  readonly onOpenImageViewer?: () => void;
  readonly selectedFrameImageSrc?: string | null;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

const DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD = 0.5;

/**
 * 홈 히어로 영역의 breakpoint 대응 3D 스테이지를 구성합니다.
 */
export const HomeHeroStageCanvas = ({
  blackoutOverlayRef,
  interactionDisabledProgressThreshold = DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD,
  onOpenImageViewer,
  selectedFrameImageSrc,
  triggerRef,
  webUiRef,
}: HomeHeroStageCanvasProps) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isCloseupCostumeHidden, setIsCloseupCostumeHidden] = useState(false);
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
      dpr={[1, 2]}
      gl={{ alpha: false, antialias: true }}
      shadows
      onCreated={({ gl }) => {
        gl.domElement.id = 'three-canvas';
        gl.domElement.style.touchAction = 'none';
        setCanvasElement(gl.domElement);
      }}
    >
      <color args={[HOME_HERO_STAGE_BACKGROUND]} attach="background" />
      <HomeHeroStageLights />
      <HomeHeroCameraRig
        blackoutOverlayRef={blackoutOverlayRef}
        currentBP={currentBP}
        interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
        onOpenImageViewer={onOpenImageViewer}
        onCloseupCostumeHiddenChange={setIsCloseupCostumeHidden}
        onScrollStateChange={setIsScrolling}
        sceneLayout={sceneLayout}
        sceneMode={sceneMode}
        triggerRef={triggerRef}
        webUiRef={webUiRef}
      />
      <Suspense fallback={null}>
        <HomeHeroSceneObjects
          isCloseupCostumeHidden={isCloseupCostumeHidden}
          selectedFrameImageSrc={selectedFrameImageSrc}
          sceneLayout={sceneLayout}
        />
      </Suspense>
    </Canvas>
  );
};

/**
 * breakpoint와 스크롤 상태에 따라 기본 카메라와 Orbit 제어를 전환합니다.
 */
const HomeHeroCameraRig = ({
  blackoutOverlayRef,
  currentBP,
  interactionDisabledProgressThreshold,
  onOpenImageViewer,
  onCloseupCostumeHiddenChange,
  onScrollStateChange,
  sceneLayout,
  sceneMode,
  triggerRef,
  webUiRef,
}: {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly currentBP: SceneBreakpoint;
  readonly interactionDisabledProgressThreshold: number;
  readonly onOpenImageViewer?: () => void;
  readonly onCloseupCostumeHiddenChange: (isCloseupCostumeHidden: boolean) => void;
  readonly onScrollStateChange: (isScrolling: boolean) => void;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneMode: 'desktop' | 'mobile';
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
}) => {
  const { isCloseupCostumeHidden, isSequenceActive, progress } = useHomeHeroSceneTransition({
    blackoutOverlayRef,
    onScrollStateChange,
    sceneLayout,
    sceneMode,
    triggerRef,
    webUiRef,
  });

  React.useEffect(() => {
    onCloseupCostumeHiddenChange(isCloseupCostumeHidden);
  }, [isCloseupCostumeHidden, onCloseupCostumeHiddenChange]);

  const isInteractionEnabled = progress < interactionDisabledProgressThreshold;

  return (
    <>
      <OrbitControls
        enablePan={false}
        enableRotate
        enableZoom={sceneMode === 'mobile'}
        enabled={sceneMode === 'mobile' || !isSequenceActive}
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
      {isInteractionEnabled ? (
        <SceneInteractionController onOpenImageViewer={onOpenImageViewer} />
      ) : null}
    </>
  );
};

/**
 * 캐릭터와 핵심 소품을 포함한 홈 전용 스테이지 구성을 breakpoint 기준으로 렌더링합니다.
 */
const HomeHeroSceneObjects = ({
  isCloseupCostumeHidden,
  selectedFrameImageSrc,
  sceneLayout,
}: {
  readonly isCloseupCostumeHidden: boolean;
  readonly selectedFrameImageSrc?: string | null;
  readonly sceneLayout: HomeHeroSceneLayout;
}) => (
  <group position={[0, -2.4, 0]}>
    <HomeHeroCharacterSeatSet instance="main" isCloseupCostumeHidden={isCloseupCostumeHidden} />
    <SceneProp
      path="/models/bass.glb"
      position={[...sceneLayout.bassPosition]}
      rotation={[...sceneLayout.bassRotation]}
    />
    <SceneProp
      frameScreenImageSrc={selectedFrameImageSrc}
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
