'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { Group, PerspectiveCamera } from 'three';
import { Vector3 } from 'three';

import { homeHeroCameraMotion } from '@/widgets/home-hero-scene/model/home-hero-camera-motion';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';

type UseHomeHeroSceneTransitionParams = {
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

/**
 * 스크롤에 따라 카메라 전진, 캔버스 페이드아웃, HTML UI 페이드인을 동기화합니다.
 */
export const useHomeHeroSceneTransition = ({
  triggerRef,
  webUiRef,
}: UseHomeHeroSceneTransitionParams) => {
  const { camera, gl } = useThree();
  const pivotRef = useRef<Group>(null);
  const cameraMountRef = useRef<Group>(null);
  const targetVector = useMemo(() => new Vector3(), []);
  const worldCameraPosition = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (!triggerRef.current || !webUiRef.current || !pivotRef.current || !cameraMountRef.current) {
      return;
    }

    const canvasElement = gl.domElement;
    const webUiElement = webUiRef.current;
    const pivot = pivotRef.current;
    const cameraMount = cameraMountRef.current;
    const desktopMedia = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY);
    const frameScroller = document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]');
    const scroller = desktopMedia.matches && frameScroller ? frameScroller : undefined;
    const motionState = {
      rotationY: homeHeroCameraMotion.initialRotationY,
      cameraOffsetX: homeHeroCameraMotion.initialCameraOffset[0],
      cameraOffsetY: homeHeroCameraMotion.initialCameraOffset[1],
      cameraOffsetZ: homeHeroCameraMotion.initialCameraOffset[2],
    };

    canvasElement.id = 'three-canvas';
    canvasElement.style.opacity = '1';
    webUiElement.id = 'web-ui';
    webUiElement.style.opacity = '0';
    webUiElement.style.pointerEvents = 'none';

    pivot.position.set(...homeHeroCameraMotion.pivotPosition);
    pivot.rotation.set(0, motionState.rotationY, 0);
    cameraMount.position.set(
      motionState.cameraOffsetX,
      motionState.cameraOffsetY,
      motionState.cameraOffsetZ,
    );

    const syncCameraState = () => {
      pivot.rotation.y = motionState.rotationY;
      cameraMount.position.set(
        motionState.cameraOffsetX,
        motionState.cameraOffsetY,
        motionState.cameraOffsetZ,
      );
    };

    const syncInteractivity = () => {
      const opacity = Number(gsap.getProperty(webUiElement, 'opacity'));
      webUiElement.style.pointerEvents =
        opacity >= homeHeroCameraMotion.interactiveThreshold ? 'auto' : 'none';
    };

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        scroller,
        trigger: triggerRef.current,
        start: 'top top',
        end: homeHeroCameraMotion.end,
        scrub: homeHeroCameraMotion.scrub,
        pin: triggerRef.current,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: syncInteractivity,
        onRefresh: syncInteractivity,
      },
    });

    timeline.to(
      motionState,
      {
        cameraOffsetZ: homeHeroCameraMotion.intermediateCameraOffset[2],
        duration: 0.44,
        onUpdate: syncCameraState,
      },
      0,
    );

    timeline.to(
      motionState,
      {
        cameraOffsetY: homeHeroCameraMotion.intermediateCameraOffset[1],
        duration: 0.44,
        onUpdate: syncCameraState,
      },
      0,
    );

    timeline.to(
      motionState,
      {
        cameraOffsetZ: homeHeroCameraMotion.finalCameraOffset[2],
        duration: 0.44,
        onUpdate: syncCameraState,
      },
      0.44,
    );

    timeline.to(
      motionState,
      {
        cameraOffsetY: homeHeroCameraMotion.finalCameraOffset[1],
        duration: 0.44,
        onUpdate: syncCameraState,
      },
      0.44,
    );

    timeline.to(
      motionState,
      {
        rotationY: homeHeroCameraMotion.finalRotationY,
        duration: 0.4,
        onUpdate: syncCameraState,
      },
      0.42,
    );

    timeline.to(
      canvasElement,
      {
        opacity: 0,
        duration: 0.1,
      },
      homeHeroCameraMotion.canvasFadeStart,
    );

    timeline.to(
      webUiElement,
      {
        opacity: 1,
        duration: 0.08,
        onUpdate: syncInteractivity,
      },
      homeHeroCameraMotion.webUiFadeStart,
    );

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      webUiElement.style.pointerEvents = 'none';
      canvasElement.style.opacity = '1';
    };
  }, [camera, gl, triggerRef, webUiRef]);

  useFrame(() => {
    if (!pivotRef.current || !cameraMountRef.current) {
      return;
    }

    const perspectiveCamera = camera as PerspectiveCamera;

    cameraMountRef.current.getWorldPosition(worldCameraPosition);
    perspectiveCamera.position.copy(worldCameraPosition);

    pivotRef.current.getWorldPosition(targetVector);
    perspectiveCamera.lookAt(targetVector);
  });

  return {
    pivotRef,
    cameraMountRef,
  };
};
