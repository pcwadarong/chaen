'use client';

import { useLayoutEffect, useState } from 'react';

import { viewportMediaQuery } from '@/shared/config/responsive';

const MOBILE_MEDIA_QUERY = viewportMediaQuery.tabletDown;

/**
 * `window.matchMedia` 기반으로 모바일 전용 editor mode 적용 여부를 추적합니다.
 */
export const useIsMobileEditorLayout = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile;
};
