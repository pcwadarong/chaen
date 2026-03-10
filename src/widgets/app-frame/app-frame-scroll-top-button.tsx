'use client';

import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
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

type ScrollElements = {
  primaryScrollRegion: HTMLElement | null;
  viewport: HTMLDivElement | null;
};

/**
 * 현재 뷰포트 조건에 맞는 스크롤 타깃을 계산합니다.
 */
const getScrollBinding = ({
  elements,
  isDesktop,
}: {
  elements: ScrollElements;
  isDesktop: boolean;
}): ScrollBinding =>
  isDesktop && elements.primaryScrollRegion
    ? (() => {
        const primaryScrollRegion = elements.primaryScrollRegion;

        return {
          readScrollTop: () => primaryScrollRegion.scrollTop,
          scrollToTop: () => primaryScrollRegion.scrollTo({ top: 0, behavior: 'smooth' }),
          target: primaryScrollRegion,
        };
      })()
    : isDesktop && elements.viewport
      ? (() => {
          const viewport = elements.viewport;

          return {
            readScrollTop: () => viewport.scrollTop,
            scrollToTop: () => viewport.scrollTo({ top: 0, behavior: 'smooth' }),
            target: viewport,
          };
        })()
      : {
          readScrollTop: () => window.scrollY,
          scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          target: window,
        };

/**
 * 현재 문서에서 스크롤 바인딩 후보를 읽습니다.
 */
const getScrollElements = (): ScrollElements => ({
  primaryScrollRegion: document.querySelector<HTMLElement>('[data-primary-scroll-region="true"]'),
  viewport: document.querySelector<HTMLDivElement>('[data-app-scroll-viewport="true"]'),
});

/**
 * 현재 뷰포트 조건에 맞는 스크롤 타깃을 계산합니다.
 */
const createScrollBinding = (isDesktop: boolean): ScrollBinding =>
  getScrollBinding({
    elements: getScrollElements(),
    isDesktop,
  });

/**
 * 프레임 스크롤 위치를 감시해 상단 이동 버튼을 렌더링합니다.
 */
export const AppFrameScrollTopButton = () => {
  const t = useTranslations('Common');
  const [isScrollTopButtonVisible, setIsScrollTopButtonVisible] = useState(false);

  useEffect(() => {
    const desktopMedia = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY);
    let activeBinding = createScrollBinding(desktopMedia.matches);

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
      activeBinding = createScrollBinding(desktopMedia.matches);
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
    const scrollBinding = createScrollBinding(window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY).matches);

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
  minWidth: '[3rem]',
  height: '[3rem]',
  minHeight: '[3rem]',
  aspectRatio: 'square',
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
