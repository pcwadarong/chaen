'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { PerspectiveCamera } from 'three';

import { getDisabledScrollTimelineSnapshot } from '@/features/scroll-timeline/model/disabled-scroll-timeline-snapshot';
import {
  getScrollTimelineSnapshot,
  type ScrollTimelineSnapshot,
  type Vector3Tuple,
} from '@/features/scroll-timeline/model/scroll-timeline-snapshot';
import { viewportMediaQuery } from '@/shared/config/responsive';

type UseScrollTimelineParams = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly enabled: boolean;
  readonly initialPosition: Vector3Tuple;
  readonly onScrollStateChange?: (isScrolling: boolean) => void;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

type UseScrollTimelineResult = {
  readonly isCloseupCostumeHidden: boolean;
  readonly isMonitorOverlayVisible: boolean;
  readonly isSequenceActive: boolean;
  readonly isScrollDriven: boolean;
};

type ScrollTimelineUiState = {
  readonly isCloseupCostumeHidden: boolean;
  readonly isMonitorOverlayVisible: boolean;
  readonly isScrollDriven: boolean;
  readonly isSequenceActive: boolean;
};

const DESKTOP_FRAME_MEDIA_QUERY = viewportMediaQuery.desktopUp;
const DESKTOP_SCROLL_SCRUB_DURATION = 0.2;
const WEB_UI_INTERACTIVE_THRESHOLD = 0.96;

/**
 * monitor overlay가 실제로 상호작용 가능한 상태인지 계산합니다.
 */
const isWebUiInteractive = (
  snapshot: Pick<ScrollTimelineSnapshot, 'isMonitorOverlayVisible' | 'webUiOpacity'>,
) => snapshot.isMonitorOverlayVisible && snapshot.webUiOpacity >= WEB_UI_INTERACTIVE_THRESHOLD;

/**
 * 스크롤 타임라인 snapshot을 기준으로 실제 카메라 위치와 방향을 동기화합니다.
 */
const syncCameraSnapshot = (
  camera: PerspectiveCamera,
  snapshot: Pick<ScrollTimelineSnapshot, 'cameraPosition' | 'lookAt'>,
) => {
  camera.position.set(...snapshot.cameraPosition);
  camera.lookAt(...snapshot.lookAt);
  camera.updateMatrixWorld();
};

/**
 * blackout overlay와 monitor overlay의 opacity 및 상호작용 상태를 동기화합니다.
 */
const syncOverlayState = (
  blackoutOverlayElement: HTMLDivElement | null,
  webUiElement: HTMLDivElement | null,
  snapshot: Pick<
    ScrollTimelineSnapshot,
    'blackoutOpacity' | 'isMonitorOverlayVisible' | 'webUiOpacity'
  >,
) => {
  if (blackoutOverlayElement) {
    blackoutOverlayElement.style.opacity = snapshot.blackoutOpacity.toFixed(3);
  }

  if (!webUiElement) return;

  webUiElement.style.opacity = snapshot.webUiOpacity.toFixed(3);
  const interactive = isWebUiInteractive(snapshot);

  webUiElement.style.pointerEvents = interactive ? 'auto' : 'none';
  webUiElement.setAttribute('aria-hidden', interactive ? 'false' : 'true');
  webUiElement.toggleAttribute('inert', !interactive);
};

/**
 * 홈 히어로 데스크탑 씬에 ScrollTrigger 기반 카메라 타임라인을 연결합니다.
 */
export const useScrollTimeline = ({
  blackoutOverlayRef,
  enabled,
  initialPosition,
  onScrollStateChange,
  triggerRef,
  webUiRef,
}: UseScrollTimelineParams): UseScrollTimelineResult => {
  const { camera } = useThree();
  const snapshotRef = useRef<ScrollTimelineSnapshot>(
    getScrollTimelineSnapshot({
      initialPosition,
      progress: 0,
    }),
  );
  const isScrollDrivenRef = useRef(false);
  const uiStateRef = useRef<ScrollTimelineUiState>({
    isCloseupCostumeHidden: false,
    isMonitorOverlayVisible: false,
    isScrollDriven: false,
    isSequenceActive: false,
  });
  const [isCloseupCostumeHidden, setIsCloseupCostumeHidden] = useState(false);
  const [isScrollDriven, setIsScrollDriven] = useState(false);
  const [isMonitorOverlayVisible, setIsMonitorOverlayVisible] = useState(false);
  const [isSequenceActive, setIsSequenceActive] = useState(false);

  useEffect(() => {
    const perspectiveCamera = camera as PerspectiveCamera;
    const blackoutOverlayElement = blackoutOverlayRef.current;
    const webUiElement = webUiRef.current;
    const applySnapshot = (nextSnapshot: ScrollTimelineSnapshot) => {
      snapshotRef.current = nextSnapshot;
      syncOverlayState(blackoutOverlayElement, webUiElement, nextSnapshot);

      if (uiStateRef.current.isCloseupCostumeHidden !== nextSnapshot.isCloseupCostumeHidden) {
        uiStateRef.current = {
          ...uiStateRef.current,
          isCloseupCostumeHidden: nextSnapshot.isCloseupCostumeHidden,
        };
        setIsCloseupCostumeHidden(nextSnapshot.isCloseupCostumeHidden);
      }

      if (uiStateRef.current.isMonitorOverlayVisible !== nextSnapshot.isMonitorOverlayVisible) {
        uiStateRef.current = {
          ...uiStateRef.current,
          isMonitorOverlayVisible: nextSnapshot.isMonitorOverlayVisible,
        };
        setIsMonitorOverlayVisible(nextSnapshot.isMonitorOverlayVisible);
      }

      isScrollDrivenRef.current = nextSnapshot.isScrollDriven;

      if (uiStateRef.current.isScrollDriven !== nextSnapshot.isScrollDriven) {
        uiStateRef.current = {
          ...uiStateRef.current,
          isScrollDriven: nextSnapshot.isScrollDriven,
        };
        setIsScrollDriven(nextSnapshot.isScrollDriven);
      }

      if (uiStateRef.current.isSequenceActive !== nextSnapshot.isSequenceActive) {
        uiStateRef.current = {
          ...uiStateRef.current,
          isSequenceActive: nextSnapshot.isSequenceActive,
        };
        setIsSequenceActive(nextSnapshot.isSequenceActive);
        onScrollStateChange?.(nextSnapshot.isSequenceActive);
      }
    };

    if (!enabled || !triggerRef.current) {
      const initialSnapshot = getDisabledScrollTimelineSnapshot({
        initialPosition,
      });

      applySnapshot(initialSnapshot);

      return;
    }

    let isDisposed = false;
    let scrollTriggerInstance: { kill: () => void } | null = null;
    const desktopMediaQuery = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY);
    const frameScroller = document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]');
    const scroller = desktopMediaQuery.matches && frameScroller ? frameScroller : undefined;
    const initialSnapshot = getScrollTimelineSnapshot({
      initialPosition,
      progress: 0,
    });

    applySnapshot(initialSnapshot);
    syncCameraSnapshot(perspectiveCamera, initialSnapshot);

    const initializeScrollTrigger = async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      if (isDisposed) return;

      gsap.registerPlugin(ScrollTrigger);
      scrollTriggerInstance = ScrollTrigger.create({
        end: () => {
          const el = triggerRef.current;

          if (!el) return '+=0';

          const navH =
            parseFloat(getComputedStyle(el).getPropertyValue('--global-nav-height')) || 0;
          const vpH = scroller?.clientHeight ?? window.innerHeight;

          // stickyWrapper height = vpH, sectionClass height = 4*vpH - 3*navH
          // clip 시작 = section.height - stickyWrapper.height = 3*(vpH - navH)
          return `+=${3 * (vpH - navH)}px`;
        },
        invalidateOnRefresh: true,
        scrub: DESKTOP_SCROLL_SCRUB_DURATION,
        scroller,
        start: 'top top',
        trigger: triggerRef.current,
        onLeave: () => {
          onScrollStateChange?.(false);
        },
        onLeaveBack: () => {
          onScrollStateChange?.(false);
        },
        onRefresh: self => {
          const nextSnapshot = getScrollTimelineSnapshot({
            initialPosition,
            progress: self.progress,
          });

          applySnapshot(nextSnapshot);

          if (!nextSnapshot.isScrollDriven) {
            syncCameraSnapshot(perspectiveCamera, nextSnapshot);
          }
        },
        onUpdate: self => {
          applySnapshot(
            getScrollTimelineSnapshot({
              initialPosition,
              progress: self.progress,
            }),
          );
        },
      });
    };

    initializeScrollTrigger();

    return () => {
      isDisposed = true;
      scrollTriggerInstance?.kill();
      const resetSnapshot = getScrollTimelineSnapshot({
        initialPosition,
        progress: 0,
      });

      applySnapshot({
        ...resetSnapshot,
        isScrollDriven: false,
        isSequenceActive: false,
      });
    };
  }, [
    blackoutOverlayRef,
    camera,
    enabled,
    initialPosition,
    onScrollStateChange,
    triggerRef,
    webUiRef,
  ]);

  useFrame(() => {
    if (!enabled || !isScrollDrivenRef.current) return;

    syncCameraSnapshot(camera as PerspectiveCamera, snapshotRef.current);
  });

  return {
    isCloseupCostumeHidden,
    isMonitorOverlayVisible,
    isSequenceActive,
    isScrollDriven,
  };
};
