'use client';

import { useEffect, useState } from 'react';

import type { SceneBreakpoint, SceneViewportMode } from '@/entities/scene/model/breakpointConfig';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';
import { getHomeHeroBreakpointState } from '@/widgets/home-hero-scene/model/home-hero-scene-breakpoint';

type UseBreakpointResult = {
  readonly currentBP: SceneBreakpoint;
  readonly sceneViewportMode: SceneViewportMode;
};

/**
 * 홈 히어로 씬에서 현재 viewport 기준 breakpoint와 씬 모드를 추적합니다.
 */
export const useBreakpoint = (): UseBreakpointResult => {
  const [state, setState] = useState<UseBreakpointResult>(() =>
    getBreakpointState(readViewportSize()),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncBreakpoint = () => {
      setState(
        getBreakpointState({
          height: window.innerHeight,
          width: window.innerWidth,
        }),
      );
    };

    let frameId: number | null = null;

    /**
     * resize 폭주를 한 프레임당 한 번으로 묶어 불필요한 재계산과 렌더를 줄입니다.
     */
    const scheduleBreakpointSync = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        syncBreakpoint();
      });
    };

    syncBreakpoint();
    window.addEventListener('resize', scheduleBreakpointSync);

    return () => {
      window.removeEventListener('resize', scheduleBreakpointSync);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return state;
};

/**
 * 현재 viewport 너비로부터 hook 반환값 모양을 계산합니다.
 */
const getBreakpointState = ({
  height,
  width,
}: {
  height: number;
  width: number;
}): UseBreakpointResult => getHomeHeroBreakpointState({ height, width });

/**
 * SSR과 CSR 모두에서 사용할 현재 viewport 크기를 읽습니다.
 */
const readViewportSize = (): { height: number; width: number } => {
  if (typeof window === 'undefined') {
    return {
      height: VIEWPORT_BREAKPOINTS.mobileLargeMax,
      width: VIEWPORT_BREAKPOINTS.desktopMax,
    };
  }

  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
};
