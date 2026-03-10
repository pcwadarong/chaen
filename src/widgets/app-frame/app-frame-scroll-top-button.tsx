'use client';

import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';

// 데스크탑 기준
const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';
// 스크롤 표시 여부 판단 기준 (픽셀 단위)
const SCROLL_TOP_BUTTON_THRESHOLD = 240;

type ScrollBinding = {
  readScrollTop: () => number;
  scrollToTop: () => void;
  target: HTMLElement | Window;
};

/**
 * 현재 뷰포트 조건에 맞는 스크롤 타깃을 계산합니다.
 */
const getScrollBinding = ({
  isDesktop,
  viewport,
}: {
  isDesktop: boolean;
  // 데스크톱: 프레임 내 스크롤 영역, 모바일: 전체 창
  viewport: HTMLDivElement | null;
}): ScrollBinding =>
  isDesktop && viewport
    ? {
        // 내부 스크롤 컨테이너의 현재 스크롤 위치
        readScrollTop: () => viewport.scrollTop,
        scrollToTop: () => viewport.scrollTo({ top: 0, behavior: 'smooth' }),
        target: viewport,
      }
    : {
        // 전체 창의 현재 스크롤 위치
        readScrollTop: () => window.scrollY,
        scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        target: window,
      };

/**
 * 프레임 스크롤 위치를 감시해 상단 이동 버튼을 렌더링합니다.
 */
export const AppFrameScrollTopButton = () => {
  const t = useTranslations('Common');
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isScrollTopButtonVisible, setIsScrollTopButtonVisible] = useState(false);

  useEffect(() => {
    viewportRef.current = document.querySelector<HTMLDivElement>(
      '[data-app-scroll-viewport="true"]',
    );

    const desktopMedia = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY);
    let activeBinding = getScrollBinding({
      isDesktop: desktopMedia.matches,
      viewport: viewportRef.current,
    });

    /**
     * 현재 스크롤 위치를 기준으로 버튼 노출 여부를 갱신합니다.
     */
    const updateVisibility = () =>
      setIsScrollTopButtonVisible(prev => {
        const next = activeBinding.readScrollTop() > SCROLL_TOP_BUTTON_THRESHOLD;
        return prev === next ? prev : next;
      });
    const onScroll = () => updateVisibility();
    const bind = () => activeBinding.target.addEventListener('scroll', onScroll, { passive: true });
    const unbind = () => activeBinding.target.removeEventListener('scroll', onScroll);

    /**
     * 데스크톱 프레임 모드 전환 시 스크롤 바인딩을 다시 계산합니다.
     */
    const handleViewportModeChange = () => {
      unbind();
      activeBinding = getScrollBinding({
        isDesktop: desktopMedia.matches,
        viewport: viewportRef.current,
      });
      updateVisibility();
      bind();
    };

    updateVisibility();
    bind();
    desktopMedia.addEventListener('change', handleViewportModeChange);

    return () => {
      unbind();
      desktopMedia.removeEventListener('change', handleViewportModeChange);
    };
  }, []);

  /**
   * 현재 활성 스크롤 타깃을 최상단으로 부드럽게 이동시킵니다.
   */
  const handleScrollTop = () => {
    const scrollBinding = getScrollBinding({
      isDesktop: window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY).matches,
      viewport: viewportRef.current,
    });

    scrollBinding.scrollToTop();
  };

  if (!isScrollTopButtonVisible) return null;

  return (
    <Button
      aria-label={t('scrollToTopAriaLabel')}
      className={appFrameScrollTopButtonClass}
      onClick={handleScrollTop}
      size="sm"
      tone="white"
      type="button"
      variant="solid"
    >
      <ArrowUpIcon aria-hidden size="md" />
    </Button>
  );
};

const appFrameScrollTopButtonClass = css({
  position: 'fixed',
  right: '[max(1rem, env(safe-area-inset-right))]',
  bottom: '[max(1rem, env(safe-area-inset-bottom))]',
  zIndex: '11',
  width: '[3rem]',
  boxShadow: '[0 18px 32px rgb(15 23 42 / 0.18)]',
  transition:
    '[transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease]',
  _hover: {
    transform: 'translateY(-2px)',
    borderColor: 'borderStrong',
  },
  '@media (min-width: 961px)': {
    position: 'absolute',
    right: '[1.25rem]',
    bottom: '[calc(1.25rem + 3rem)]',
  },
});
