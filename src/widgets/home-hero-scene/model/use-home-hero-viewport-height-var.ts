'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

import { getHomeHeroViewportMetrics } from '@/widgets/home-hero-scene/model/home-hero-viewport-metrics';

/**
 * 홈 히어로가 속한 실제 scroll viewport 높이를 CSS 변수로 동기화합니다.
 *
 * 데스크톱 app-frame 안에서는 `100%`나 `100dvh` 기준이 실제 보이는 viewport와 어긋날 수 있어,
 * 가장 가까운 scroll viewport의 clientHeight를 읽어 `--home-hero-viewport-height`에 저장합니다.
 * 동시에 nav 높이를 제외한 공통 가용 높이와 데스크톱 스크롤 섹션 전체 높이도
 * 실제 px 값으로 계산해 저장해, hero/contact 레이아웃이 긴 `calc(...)`를 반복하지 않도록 맞춥니다.
 */
export const useHomeHeroViewportHeightVar = (sectionRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return;

    const sectionElement = sectionRef.current;
    const viewportElement =
      sectionElement.closest<HTMLElement>('[data-app-scroll-viewport="true"]') ?? null;
    const styleScope = viewportElement ?? document.documentElement;

    /**
     * 공유된 nav 높이 변수를 읽어 홈 히어로 가용 높이 계산에 사용합니다.
     */
    const readNavHeight = () =>
      parseFloat(getComputedStyle(styleScope).getPropertyValue('--global-nav-height')) || 0;

    let lastViewportHeight = '';
    let lastAvailableHeight = '';
    let lastScrollSectionHeight = '';

    const syncViewportHeight = () => {
      const windowHeight = window.innerHeight;
      // viewportElement.clientHeight가 window.innerHeight보다 작을 때만 사용
      // app-frame이 고정 높이가 아닌 경우 clientHeight가 콘텐츠에 따라 늘어나므로, section 높이 → viewport 높이 → section 높이 무한 루프가 발생
      const viewportClientHeight = viewportElement?.clientHeight ?? null;
      const nextHeight =
        viewportClientHeight !== null && viewportClientHeight < windowHeight
          ? viewportClientHeight
          : windowHeight;
      const navHeight = readNavHeight();
      const { availableHeight, scrollSectionHeight, viewportHeight } = getHomeHeroViewportMetrics({
        navHeight,
        viewportHeight: nextHeight,
      });
      const viewportHeightValue = `${viewportHeight}px`;
      const availableHeightValue = `${availableHeight}px`;
      const scrollSectionHeightValue = `${scrollSectionHeight}px`;

      if (lastViewportHeight !== viewportHeightValue) {
        styleScope.style.setProperty('--home-hero-viewport-height', viewportHeightValue);
        lastViewportHeight = viewportHeightValue;
      }

      if (lastAvailableHeight !== availableHeightValue) {
        styleScope.style.setProperty('--home-hero-available-height', availableHeightValue);
        lastAvailableHeight = availableHeightValue;
      }

      if (lastScrollSectionHeight !== scrollSectionHeightValue) {
        styleScope.style.setProperty('--home-hero-scroll-section-height', scrollSectionHeightValue);
        lastScrollSectionHeight = scrollSectionHeightValue;
      }
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

    let mutationObserver: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        syncViewportHeight();
      });
      mutationObserver.observe(styleScope, {
        attributeFilter: ['style'],
        attributes: true,
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', syncViewportHeight);
      styleScope.style.removeProperty('--home-hero-scroll-section-height');
      styleScope.style.removeProperty('--home-hero-available-height');
      styleScope.style.removeProperty('--home-hero-viewport-height');
    };
  }, [sectionRef]);
};
