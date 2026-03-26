'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * 전역 네비게이션의 실제 높이를 CSS 변수로 동기화합니다.
 *
 * 홈 히어로처럼 viewport 높이를 기준으로 첫 화면을 계산하는 섹션이
 * sticky 네비게이션 높이까지 반영할 수 있도록 실제 높이를 유지합니다.
 * viewport 리사이즈와 헤더 자체 높이 변화를 모두 감지해 최신 값을 보장합니다.
 */
export const useGlobalNavHeightVar = (headerRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !headerRef.current) return;

    const headerElement = headerRef.current;

    const styleScope =
      document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]') ??
      document.documentElement;

    /**
     * 네비 실제 높이를 레이아웃 계산용 CSS 변수로 저장합니다.
     */
    const syncHeaderHeight = () => {
      styleScope.style.setProperty('--global-nav-height', `${headerElement.offsetHeight}px`);
    };

    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', syncHeaderHeight);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      syncHeaderHeight();
    });

    resizeObserver.observe(headerElement);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncHeaderHeight);
    };
  }, [headerRef]);
};
