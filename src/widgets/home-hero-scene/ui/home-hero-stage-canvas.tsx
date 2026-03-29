'use client';

import { Html, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useLocale, useTranslations } from 'next-intl';
import React, { type RefObject, Suspense, useCallback, useMemo, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import type { SceneBreakpoint } from '@/entities/scene/model/breakpointConfig';
import { SceneProp } from '@/entities/scene/ui/scene-prop';
import { useBassAudio } from '@/features/audio/model/use-bass-audio';
import { scrollHomeHeroToProjects } from '@/features/interaction/model/scroll-home-hero-to-projects';
import { SceneInteractionController } from '@/features/interaction/ui/scene-interaction-controller';
import { useMonitorOverlayTexture } from '@/features/monitor-overlay/model/use-monitor-overlay-texture';
import { PauseIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import {
  getHomeHeroSceneLayout,
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type HomeHeroSceneLayout,
} from '@/widgets/home-hero-scene/model/home-hero-scene-layout';
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
  readonly items?: ProjectListItem[];
  readonly onBrowseProjects?: () => void;
  readonly onOpenImageViewer?: () => void;
  readonly selectedFrameImageSrc?: string | null;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

const DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD = 0.5;
const BASS_STOP_BUTTON_SIZE = '7';
const BASS_STOP_BUTTON_FOCUS_OUTLINE = '[2px solid var(--colors-focus-ring)]';
const BASS_STOP_BUTTON_FOCUS_OUTLINE_OFFSET = '[2px]';

/**
 * 홈 히어로 영역의 breakpoint 대응 3D 스테이지를 구성합니다.
 */
export const HomeHeroStageCanvas = ({
  blackoutOverlayRef,
  interactionDisabledProgressThreshold = DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD,
  items = [],
  onBrowseProjects,
  onOpenImageViewer,
  selectedFrameImageSrc,
  triggerRef,
  webUiRef,
}: HomeHeroStageCanvasProps) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isCloseupCostumeHidden, setIsCloseupCostumeHidden] = useState(false);
  const [monitorScreenOpacity, setMonitorScreenOpacity] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const projectDetailTranslations = useTranslations('ProjectDetail');
  const {
    isBackgroundMusicPlaying,
    pauseBackgroundMusicPlayback,
    playBassString,
    toggleBackgroundMusicPlayback,
  } = useBassAudio();
  const { currentBP, sceneMode } = useBreakpoint({
    isScrolling,
  });
  const handleBrowseProjects = useCallback(() => {
    if (sceneMode === 'mobile') {
      onBrowseProjects?.();
      return;
    }

    scrollHomeHeroToProjects(triggerRef.current);
  }, [onBrowseProjects, sceneMode, triggerRef]);
  useAllowCanvasContextMenu(canvasElement);
  const sceneLayout = useMemo(
    () =>
      getHomeHeroSceneLayout({
        currentBP,
      }),
    [currentBP],
  );
  const monitorScreenTexture = useMonitorOverlayTexture({
    items,
    locale,
    ongoingLabel: projectDetailTranslations('ongoing'),
  });

  return (
    <Canvas
      camera={{
        far: HOME_HERO_CAMERA_FAR,
        fov: sceneLayout.camera.fov,
        near: HOME_HERO_CAMERA_NEAR,
        position: sceneLayout.camera.position,
      }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      shadows
      onCreated={({ gl }) => {
        gl.domElement.id = 'three-canvas';
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.setAttribute('role', 'presentation');
        gl.domElement.style.touchAction = 'none';
        gl.setClearColor(0x000000, 0);
        setCanvasElement(gl.domElement);
      }}
    >
      <HomeHeroStageLights />
      <HomeHeroCameraRig
        blackoutOverlayRef={blackoutOverlayRef}
        currentBP={currentBP}
        interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
        onBrowseProjects={handleBrowseProjects}
        onMonitorOverlayOpacityChange={setMonitorScreenOpacity}
        onOpenImageViewer={onOpenImageViewer}
        onPlayBassString={playBassString}
        onCloseupCostumeHiddenChange={setIsCloseupCostumeHidden}
        onScrollStateChange={setIsScrolling}
        sceneLayout={sceneLayout}
        sceneMode={sceneMode}
        onToggleBackgroundMusicPlayback={toggleBackgroundMusicPlayback}
        triggerRef={triggerRef}
        webUiRef={webUiRef}
      />
      <Suspense fallback={null}>
        <HomeHeroSceneObjects
          isBackgroundMusicPlaying={isBackgroundMusicPlaying}
          isCloseupCostumeHidden={isCloseupCostumeHidden}
          monitorScreenOpacity={monitorScreenOpacity}
          monitorScreenTexture={monitorScreenTexture}
          pauseMusicLabel={t('pauseMusic')}
          onStopBassTrackPlayback={pauseBackgroundMusicPlayback}
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
  onBrowseProjects,
  onMonitorOverlayOpacityChange,
  onOpenImageViewer,
  onPlayBassString,
  onCloseupCostumeHiddenChange,
  onScrollStateChange,
  sceneLayout,
  sceneMode,
  onToggleBackgroundMusicPlayback,
  triggerRef,
  webUiRef,
}: {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly currentBP: SceneBreakpoint;
  readonly interactionDisabledProgressThreshold: number;
  readonly onBrowseProjects: () => void;
  readonly onMonitorOverlayOpacityChange: (opacity: number) => void;
  readonly onOpenImageViewer?: () => void;
  readonly onPlayBassString: (
    stringName: 'line1' | 'line2' | 'line3' | 'line4',
  ) => void | Promise<void>;
  readonly onCloseupCostumeHiddenChange: (isCloseupCostumeHidden: boolean) => void;
  readonly onScrollStateChange: (isScrolling: boolean) => void;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneMode: 'desktop' | 'mobile';
  readonly onToggleBackgroundMusicPlayback: () => void | Promise<void>;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
}) => {
  const { isCloseupCostumeHidden, isSequenceActive, monitorOverlayOpacity, progress } =
    useHomeHeroSceneTransition({
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

  React.useEffect(() => {
    onMonitorOverlayOpacityChange(monitorOverlayOpacity);
  }, [monitorOverlayOpacity, onMonitorOverlayOpacityChange]);

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
        <SceneInteractionController
          onBrowseProjects={onBrowseProjects}
          onOpenImageViewer={onOpenImageViewer}
          onPlayBassString={onPlayBassString}
          onToggleBackgroundMusicPlayback={onToggleBackgroundMusicPlayback}
        />
      ) : null}
    </>
  );
};

/**
 * 캐릭터와 핵심 소품을 포함한 홈 전용 스테이지 구성을 breakpoint 기준으로 렌더링합니다.
 */
const HomeHeroSceneObjects = ({
  isBackgroundMusicPlaying,
  isCloseupCostumeHidden,
  monitorScreenOpacity,
  monitorScreenTexture,
  pauseMusicLabel,
  onStopBassTrackPlayback,
  selectedFrameImageSrc,
  sceneLayout,
}: {
  readonly isBackgroundMusicPlaying: boolean;
  readonly isCloseupCostumeHidden: boolean;
  readonly monitorScreenOpacity: number;
  readonly monitorScreenTexture: ReturnType<typeof useMonitorOverlayTexture>;
  readonly pauseMusicLabel: string;
  readonly onStopBassTrackPlayback: () => void;
  readonly selectedFrameImageSrc?: string | null;
  readonly sceneLayout: HomeHeroSceneLayout;
}) => (
  <group position={[0, -2.4, 0]}>
    <HomeHeroCharacterSeatSet
      instance="main"
      isCloseupCostumeHidden={isCloseupCostumeHidden}
      monitorScreenOpacity={monitorScreenOpacity}
      monitorScreenTexture={monitorScreenTexture}
    />
    <group position={[...sceneLayout.bassPosition]} rotation={[...sceneLayout.bassRotation]}>
      <SceneProp path="/models/bass.glb" position={[0, 0, 0]} />
      {isBackgroundMusicPlaying ? (
        <Html center distanceFactor={8} position={[0, 2.2, 0]} transform>
          <button
            aria-label={pauseMusicLabel}
            className={bassStopButtonClass}
            onClick={onStopBassTrackPlayback}
            type="button"
          >
            <PauseIcon aria-hidden color="white" size={12} />
            <span className={cx(srOnlyClass, bassStopButtonLabelClass)}>{pauseMusicLabel}</span>
          </button>
        </Html>
      ) : null}
    </group>
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

const bassStopButtonClass = css({
  width: BASS_STOP_BUTTON_SIZE,
  height: BASS_STOP_BUTTON_SIZE,
  minWidth: BASS_STOP_BUTTON_SIZE,
  minHeight: BASS_STOP_BUTTON_SIZE,
  padding: '0',
  lineHeight: '[0]',
  borderRadius: 'full',
  borderWidth: '0',
  borderStyle: 'none',
  background: '[rgba(9, 12, 26, 0.42)]',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'floating',
  backdropBlur: 'md',
  cursor: 'pointer',
  transition: 'common',
  _hover: {
    background: '[rgba(9, 12, 26, 0.58)]',
    transform: 'scale(1.04)',
  },
  _focusVisible: {
    outline: BASS_STOP_BUTTON_FOCUS_OUTLINE,
    outlineOffset: BASS_STOP_BUTTON_FOCUS_OUTLINE_OFFSET,
  },
});

const bassStopButtonLabelClass = css({
  color: 'transparent',
});
