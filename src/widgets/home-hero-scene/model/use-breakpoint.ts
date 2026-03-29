'use client';

import { useEffect, useState } from 'react';

import type { SceneBreakpoint, SceneMode } from '@/entities/scene/model/breakpointConfig';
import { VIEWPORT_BREAKPOINTS } from '@/shared/config/responsive';
import { getHomeHeroBreakpointState } from '@/widgets/home-hero-scene/model/home-hero-scene-breakpoint';

type UseBreakpointParams = {
  readonly isScrolling?: boolean;
};

type UseBreakpointResult = {
  readonly currentBP: SceneBreakpoint;
  readonly sceneMode: SceneMode;
};

/**
 * 홈 히어로 씬에서 현재 viewport 기준 breakpoint와 씬 모드를 추적합니다.
 *
 * 스크롤 시퀀스가 진행 중일 때는 resize로 sceneMode를 바꾸지 않고,
 * 시퀀스가 끝난 뒤 현재 너비를 한 번 더 읽어 동기화합니다.
 */
export const useBreakpoint = ({
  isScrolling = false,
}: UseBreakpointParams = {}): UseBreakpointResult => {
  const [state, setState] = useState<UseBreakpointResult>(() =>
    getBreakpointState(readViewportSize()),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncBreakpoint = () => {
      if (isScrolling) return;
      setState(
        getBreakpointState({
          height: window.innerHeight,
          width: window.innerWidth,
        }),
      );
    };

    syncBreakpoint();
    window.addEventListener('resize', syncBreakpoint);

    return () => {
      window.removeEventListener('resize', syncBreakpoint);
    };
  }, [isScrolling]);

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
