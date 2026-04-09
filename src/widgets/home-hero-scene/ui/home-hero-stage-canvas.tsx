'use client';

import { Html, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useLocale, useTranslations } from 'next-intl';
import React, { Suspense, useMemo, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { SceneBreakpoint, SceneViewportMode } from '@/entities/scene/model/breakpointConfig';
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
import { initializeHomeHeroStageCanvas } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-adapter';
import { createHomeHeroStageCanvasInteractionHandlers } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-interaction';
import { resolveHomeHeroStageCanvasRuntime } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-runtime';
import type {
  HomeHeroStageCanvasProps,
  HomeHeroStageSceneRefs,
} from '@/widgets/home-hero-scene/model/home-hero-stage-contract';
import { useAllowCanvasContextMenu } from '@/widgets/home-hero-scene/model/use-allow-canvas-context-menu';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';
import { useHomeHeroSceneTransition } from '@/widgets/home-hero-scene/model/use-home-hero-scene-transition';
import {
  HomeHeroCharacterSeatSet,
  HomeHeroStageLights,
} from '@/widgets/home-hero-scene/ui/home-hero-scene-primitives';
import { HomeHeroStageReadyBridge } from '@/widgets/home-hero-scene/ui/home-hero-stage-loading-bridge';

type HomeHeroCanvasInteractionHandlers = Readonly<{
  onBrowseProjects: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString: (stringName: 'line1' | 'line2' | 'line3' | 'line4') => void | Promise<void>;
  onPrepareAudioPlayback: () => void;
  onToggleBackgroundMusicPlayback: () => void | Promise<void>;
}>;

const DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD = 0.5;
const BASS_STOP_BUTTON_SIZE = '7';
const BASS_STOP_BUTTON_FOCUS_OUTLINE = '[2px solid var(--colors-focus-ring)]';
const BASS_STOP_BUTTON_FOCUS_OUTLINE_OFFSET = '[2px]';
const AUDIO_PREPARE_KEYBOARD_KEYS = new Set(['Enter', ' ']);

/**
 * 홈 히어로 영역의 breakpoint 대응 3D 스테이지를 구성합니다.
 */
export const HomeHeroStageCanvas = ({
  content,
  interaction,
  onCanvasInitializedChange,
  onSceneReadyChange,
  sceneRefs,
}: HomeHeroStageCanvasProps) => {
  const items = content?.items ?? [];
  const selectedFrameImageSrc = content?.selectedFrameImageSrc;
  const interactionDisabledProgressThreshold =
    interaction?.interactionDisabledProgressThreshold ??
    DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD;
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isCloseupCostumeHidden, setIsCloseupCostumeHidden] = useState(false);
  const [monitorScreenOpacity, setMonitorScreenOpacity] = useState(0);
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const projectDetailTranslations = useTranslations('ProjectDetail');
  const {
    isBackgroundMusicPlaying,
    pauseBackgroundMusicPlayback,
    playBassString,
    prepareBassAudioPlayback,
    toggleBackgroundMusicPlayback,
  } = useBassAudio();
  const { currentBP, sceneViewportMode } = useBreakpoint();
  const { renderQuality } = useMemo(
    () =>
      resolveHomeHeroStageCanvasRuntime({
        interactionDisabledProgressThreshold,
        isSequenceActive: false,
        progress: 0,
        sceneViewportMode,
      }),
    [interactionDisabledProgressThreshold, sceneViewportMode],
  );
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
  const interactionHandlers = useMemo(
    () =>
      createHomeHeroStageCanvasInteractionHandlers({
        onBrowseProjects: interaction?.onBrowseProjects,
        onOpenImageViewer: interaction?.onOpenImageViewer,
        onPlayBassString: playBassString,
        onPrepareAudioPlayback: prepareBassAudioPlayback,
        onToggleBackgroundMusicPlayback: toggleBackgroundMusicPlayback,
        sceneViewportMode,
        scrollToProjects: scrollHomeHeroToProjects,
        triggerElementRef: sceneRefs.triggerRef,
      }),
    [
      interaction?.onBrowseProjects,
      interaction?.onOpenImageViewer,
      playBassString,
      prepareBassAudioPlayback,
      sceneRefs.triggerRef,
      sceneViewportMode,
      toggleBackgroundMusicPlayback,
    ],
  );

  return (
    <div className={canvasStageClass}>
      <Canvas
        camera={{
          far: HOME_HERO_CAMERA_FAR,
          fov: sceneLayout.camera.fov,
          near: HOME_HERO_CAMERA_NEAR,
          position: sceneLayout.camera.position,
        }}
        dpr={renderQuality.dpr}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        shadows={renderQuality.shadows}
        onCreated={({ gl }) => {
          initializeHomeHeroStageCanvas({
            canvasElement: gl.domElement,
            setClearColor: gl.setClearColor,
          });
          setCanvasElement(gl.domElement);
          onCanvasInitializedChange?.(true);
        }}
      >
        <HomeHeroStageLights />
        <HomeHeroCameraRig
          currentBP={currentBP}
          interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
          onMonitorOverlayOpacityChange={setMonitorScreenOpacity}
          onCloseupCostumeHiddenChange={setIsCloseupCostumeHidden}
          sceneLayout={sceneLayout}
          sceneRefs={sceneRefs}
          sceneViewportMode={sceneViewportMode}
          showOutlineEffect={renderQuality.enableOutlineComposer}
          interactionHandlers={interactionHandlers}
        />
        <Suspense fallback={null}>
          <HomeHeroStageReadyBridge
            isReady
            onReadyChange={onSceneReadyChange ?? noopBooleanHandler}
          />
          <HomeHeroSceneObjects
            isBackgroundMusicPlaying={isBackgroundMusicPlaying}
            isCloseupCostumeHidden={isCloseupCostumeHidden}
            monitorScreenOpacity={monitorScreenOpacity}
            monitorScreenTexture={monitorScreenTexture}
            pauseMusicLabel={t('pauseMusic')}
            onPrepareAudioPlayback={prepareBassAudioPlayback}
            onStopBassTrackPlayback={pauseBackgroundMusicPlayback}
            selectedFrameImageSrc={selectedFrameImageSrc}
            sceneLayout={sceneLayout}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

const noopBooleanHandler = () => {};

/**
 * breakpoint와 스크롤 상태에 따라 기본 카메라와 Orbit 제어를 전환합니다.
 */
const HomeHeroCameraRig = ({
  currentBP,
  interactionDisabledProgressThreshold,
  onMonitorOverlayOpacityChange,
  onCloseupCostumeHiddenChange,
  sceneLayout,
  sceneRefs,
  sceneViewportMode,
  showOutlineEffect,
  interactionHandlers,
}: {
  readonly currentBP: SceneBreakpoint;
  readonly interactionDisabledProgressThreshold: number;
  readonly onMonitorOverlayOpacityChange: (opacity: number) => void;
  readonly onCloseupCostumeHiddenChange: (isCloseupCostumeHidden: boolean) => void;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneRefs: HomeHeroStageSceneRefs;
  readonly sceneViewportMode: SceneViewportMode;
  readonly showOutlineEffect: boolean;
  readonly interactionHandlers: HomeHeroCanvasInteractionHandlers;
}) => {
  const { isCloseupCostumeHidden, isSequenceActive, monitorOverlayOpacity, progress } =
    useHomeHeroSceneTransition({
      blackoutOverlayRef: sceneRefs.blackoutOverlayRef,
      sceneLayout,
      sceneViewportMode,
      triggerRef: sceneRefs.triggerRef,
      webUiContentRef: sceneRefs.webUiContentRef,
      webUiRef: sceneRefs.webUiRef,
    });

  const runtime = React.useMemo(
    () =>
      resolveHomeHeroStageCanvasRuntime({
        interactionDisabledProgressThreshold,
        isSequenceActive,
        progress,
        sceneViewportMode,
      }),
    [interactionDisabledProgressThreshold, isSequenceActive, progress, sceneViewportMode],
  );

  React.useEffect(() => {
    onCloseupCostumeHiddenChange(isCloseupCostumeHidden);
  }, [isCloseupCostumeHidden, onCloseupCostumeHiddenChange]);

  React.useEffect(() => {
    onMonitorOverlayOpacityChange(monitorOverlayOpacity);
  }, [monitorOverlayOpacity, onMonitorOverlayOpacityChange]);

  return (
    <>
      <OrbitControls
        enablePan={false}
        enableRotate
        enableZoom={runtime.shouldEnableOrbitZoom}
        enabled={runtime.areOrbitControlsEnabled}
        key={`${sceneViewportMode}-${currentBP}`}
        makeDefault
        maxAzimuthAngle={sceneLayout.camera.maxAzimuthAngle}
        maxDistance={sceneLayout.camera.maxDistance}
        maxPolarAngle={sceneLayout.camera.maxPolarAngle}
        minAzimuthAngle={sceneLayout.camera.minAzimuthAngle}
        minDistance={sceneLayout.camera.minDistance}
        minPolarAngle={sceneLayout.camera.minPolarAngle}
        target={sceneLayout.camera.lookAt}
      />
      {runtime.isInteractionEnabled ? (
        <SceneInteractionController
          onBrowseProjects={interactionHandlers.onBrowseProjects}
          onOpenImageViewer={interactionHandlers.onOpenImageViewer}
          onPlayBassString={interactionHandlers.onPlayBassString}
          onPrepareAudioPlayback={interactionHandlers.onPrepareAudioPlayback}
          showOutlineEffect={showOutlineEffect}
          onToggleBackgroundMusicPlayback={interactionHandlers.onToggleBackgroundMusicPlayback}
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
  onPrepareAudioPlayback,
  onStopBassTrackPlayback,
  selectedFrameImageSrc,
  sceneLayout,
}: {
  readonly isBackgroundMusicPlaying: boolean;
  readonly isCloseupCostumeHidden: boolean;
  readonly monitorScreenOpacity: number;
  readonly monitorScreenTexture: ReturnType<typeof useMonitorOverlayTexture>;
  readonly pauseMusicLabel: string;
  readonly onPrepareAudioPlayback: () => void;
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
            onKeyDown={event => {
              if (!AUDIO_PREPARE_KEYBOARD_KEYS.has(event.key)) return;

              onPrepareAudioPlayback();
            }}
            onPointerDownCapture={onPrepareAudioPlayback}
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
  backgroundColor: '[color-mix(in srgb, var(--colors-gray-950) 42%, transparent)]',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'floating',
  backdropBlur: 'md',
  cursor: 'pointer',
  transition: 'common',
  _hover: {
    backgroundColor: '[color-mix(in srgb, var(--colors-gray-950) 58%, transparent)]',
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

const canvasStageClass = css({
  position: 'relative',
  width: 'full',
  height: 'full',
});
