'use client';

import { useEffect, useState } from 'react';

const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 현재 런타임이 reduced motion 선호 상태인지 판별합니다.
 * 강한 카메라 이동이나 스크롤 연동 모션을 줄여야 하는 UI에서 사용합니다.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQueryList = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
    setPrefersReducedMotion(mediaQueryList.matches);

    /**
     * reduced motion 선호 상태가 바뀌면 현재 모션 정책을 다시 동기화합니다.
     */
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
