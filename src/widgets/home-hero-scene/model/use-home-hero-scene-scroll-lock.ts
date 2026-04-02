'use client';

import { useEffect } from 'react';

const APP_SCROLL_VIEWPORT_SELECTOR = '[data-app-scroll-viewport="true"]';

/**
 * 홈 씬 초기 자산 로딩 동안 body와 app-frame viewport 스크롤을 잠급니다.
 *
 * 로더가 보이는 동안만 잠금이 유지되며, 해제 시 기존 inline style을 복원합니다.
 *
 * @param locked 스크롤 잠금 여부입니다.
 */
export const useHomeHeroSceneScrollLock = (locked: boolean): void => {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const appScrollViewport = document.querySelector<HTMLElement>(APP_SCROLL_VIEWPORT_SELECTOR);
    const previousHtmlOverflow = htmlElement.style.overflow;
    const previousBodyOverflow = bodyElement.style.overflow;
    const previousBodyTouchAction = bodyElement.style.touchAction;
    const previousViewportOverflowY = appScrollViewport?.style.overflowY ?? '';
    const previousViewportOverscrollBehaviorY = appScrollViewport?.style.overscrollBehaviorY ?? '';

    htmlElement.style.overflow = 'hidden';
    bodyElement.style.overflow = 'hidden';
    bodyElement.style.touchAction = 'none';

    if (appScrollViewport) {
      appScrollViewport.style.overflowY = 'hidden';
      appScrollViewport.style.overscrollBehaviorY = 'none';
    }

    return () => {
      htmlElement.style.overflow = previousHtmlOverflow;
      bodyElement.style.overflow = previousBodyOverflow;
      bodyElement.style.touchAction = previousBodyTouchAction;

      if (appScrollViewport) {
        appScrollViewport.style.overflowY = previousViewportOverflowY;
        appScrollViewport.style.overscrollBehaviorY = previousViewportOverscrollBehaviorY;
      }
    };
  }, [locked]);
};
