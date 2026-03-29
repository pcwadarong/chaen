'use client';

import { useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import type { PerspectiveCamera } from 'three';

import type { SceneMode } from '@/entities/scene/model/breakpointConfig';
import { useScrollTimeline } from '@/features/scroll-timeline/model/use-scroll-timeline';
import {
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type HomeHeroSceneLayout,
} from '@/widgets/home-hero-scene/model/home-hero-scene-layout';

type UseHomeHeroSceneTransitionParams = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly onScrollStateChange: (isScrolling: boolean) => void;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneMode: SceneMode;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiContentRef?: RefObject<HTMLDivElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

/**
 * 홈 히어로 씬의 기본 카메라 상태와 데스크탑 스크롤 타임라인 연결을 함께 관리합니다.
 */
export const useHomeHeroSceneTransition = ({
  blackoutOverlayRef,
  onScrollStateChange,
  sceneLayout,
  sceneMode,
  triggerRef,
  webUiContentRef,
  webUiRef,
}: UseHomeHeroSceneTransitionParams) => {
  const { camera } = useThree();
  const {
    isCloseupCostumeHidden,
    monitorOverlayOpacity,
    isScrollDriven,
    isSequenceActive,
    progress,
  } = useScrollTimeline({
    blackoutOverlayRef,
    enabled: sceneMode === 'desktop',
    initialPosition: sceneLayout.camera.position,
    onScrollStateChange,
    triggerRef,
    webUiContentRef,
    webUiRef,
  });

  useEffect(() => {
    const perspectiveCamera = camera as PerspectiveCamera;

    perspectiveCamera.fov = sceneLayout.camera.fov;
    perspectiveCamera.near = HOME_HERO_CAMERA_NEAR;
    perspectiveCamera.far = HOME_HERO_CAMERA_FAR;
    perspectiveCamera.updateProjectionMatrix();

    if (sceneMode === 'desktop' && isScrollDriven) {
      perspectiveCamera.updateMatrixWorld();

      return;
    }

    perspectiveCamera.position.set(...sceneLayout.camera.position);
    perspectiveCamera.lookAt(...sceneLayout.camera.lookAt);
    perspectiveCamera.updateMatrixWorld();
  }, [camera, isScrollDriven, sceneLayout, sceneMode]);

  return {
    isCloseupCostumeHidden,
    monitorOverlayOpacity,
    isSequenceActive,
    isScrollDriven,
    progress,
  };
};
