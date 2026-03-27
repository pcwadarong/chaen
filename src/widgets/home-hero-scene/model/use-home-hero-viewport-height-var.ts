'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * 홈 히어로가 속한 실제 scroll viewport 높이를 CSS 변수로 동기화합니다.
 *
 * 데스크톱 app-frame 안에서는 `100%`나 `100dvh` 기준이 실제 보이는 viewport와 어긋날 수 있어,
 * 가장 가까운 scroll viewport의 clientHeight를 읽어 `--home-hero-viewport-height`에 저장합니다.
 */
export const useHomeHeroViewportHeightVar = (sectionRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return;

    const sectionElement = sectionRef.current;
    const viewportElement =
      sectionElement.closest<HTMLElement>('[data-app-scroll-viewport="true"]') ?? null;
    const styleScope = viewportElement ?? document.documentElement;

    const syncViewportHeight = () => {
      const windowHeight = window.innerHeight;
      // viewportElement.clientHeight가 window.innerHeight보다 작을 때만 사용
      // app-frame이 고정 높이가 아닌 경우 clientHeight가 콘텐츠에 따라 늘어나므로, section 높이 → viewport 높이 → section 높이 무한 루프가 발생
      const viewportClientHeight = viewportElement?.clientHeight ?? null;
      const nextHeight =
        viewportClientHeight !== null && viewportClientHeight < windowHeight
          ? viewportClientHeight
          : windowHeight;

      styleScope.style.setProperty('--home-hero-viewport-height', `${nextHeight}px`);
    };

    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', syncViewportHeight);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      syncViewportHeight();
    });

    if (viewportElement) {
      resizeObserver.observe(viewportElement);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncViewportHeight);
      styleScope.style.removeProperty('--home-hero-viewport-height');
    };
  }, [sectionRef]);
};
