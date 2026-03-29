'use client';

import { useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import type { PerspectiveCamera } from 'three';

import {
  SCENE_VIEWPORT_MODE,
  type SceneViewportMode,
} from '@/entities/scene/model/breakpointConfig';
import { useScrollTimeline } from '@/features/scroll-timeline/model/use-scroll-timeline';
import {
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
  type HomeHeroSceneLayout,
} from '@/widgets/home-hero-scene/model/home-hero-scene-layout';

type UseHomeHeroSceneTransitionParams = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly sceneLayout: HomeHeroSceneLayout;
  readonly sceneViewportMode: SceneViewportMode;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiContentRef?: RefObject<HTMLDivElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

/**
 * 홈 히어로 씬의 기본 카메라 상태와 wide 구도 스크롤 타임라인 연결을 함께 관리합니다.
 */
export const useHomeHeroSceneTransition = ({
  blackoutOverlayRef,
  sceneLayout,
  sceneViewportMode,
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
    enabled: sceneViewportMode === SCENE_VIEWPORT_MODE.wide,
    initialPosition: sceneLayout.camera.position,
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

    if (sceneViewportMode === SCENE_VIEWPORT_MODE.wide && isScrollDriven) {
      perspectiveCamera.updateMatrixWorld();

      return;
    }

    perspectiveCamera.position.set(...sceneLayout.camera.position);
    perspectiveCamera.lookAt(...sceneLayout.camera.lookAt);
    perspectiveCamera.updateMatrixWorld();
  }, [camera, isScrollDriven, sceneLayout, sceneViewportMode]);

  return {
    isCloseupCostumeHidden,
    monitorOverlayOpacity,
    isSequenceActive,
    isScrollDriven,
    progress,
  };
};
