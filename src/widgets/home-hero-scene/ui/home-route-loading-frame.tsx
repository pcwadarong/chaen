'use client';

import React, { useRef } from 'react';
import { css } from 'styled-system/css';

import { useHomeHeroViewportHeightVar } from '@/widgets/home-hero-scene/model/use-home-hero-viewport-height-var';
import { HomeRouteLoadingOverlay } from '@/widgets/home-hero-scene/ui/home-route-loading-overlay';

/**
 * 홈 라우트 loading 동안 실제 hero와 비슷한 페이지 높이와 viewport 변수를 먼저 동기화합니다.
 * app-frame 내부 viewport 기준 높이를 선반영해, 로딩에서 본문으로 넘어갈 때 스크롤 길이 변화가 줄어들게 합니다.
 */
export const HomeRouteLoadingFrame = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useHomeHeroViewportHeightVar(sectionRef);

  return (
    <main className={loadingPageClass} data-hide-app-frame-footer="true">
      <section className={loadingSectionClass} ref={sectionRef}>
        <div className={loadingStickyViewportClass} />
      </section>
      <section aria-hidden="true" className={contactPlaceholderClass} />
      <HomeRouteLoadingOverlay />
    </main>
  );
};

const loadingPageClass = css({
  width: 'full',
  display: 'grid',
  gap: '0',
  overflowX: 'clip',
});

const loadingSectionClass = css({
  width: 'full',
  height: '[var(--home-hero-available-height, 100svh)]',
  overflow: 'clip',
  _desktopUp: {
    marginTop: '[calc(-1 * var(--global-nav-height, 0px))]',
    height:
      '[var(--home-hero-scroll-section-height, calc((100dvh - var(--global-nav-height, 0px)) * 4 + var(--global-nav-height, 0px)))]',
  },
});

const loadingStickyViewportClass = css({
  position: 'sticky',
  top: '0',
  width: 'full',
  height: '[var(--home-hero-available-height, 100svh)]',
  overflow: 'clip',
  backgroundColor: '[#5d5bff]',
  _desktopUp: {
    height: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});

const contactPlaceholderClass = css({
  display: 'none',
  _desktopUp: {
    display: 'block',
    width: 'full',
    minHeight: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});
