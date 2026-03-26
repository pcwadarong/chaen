'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

import { createHomeHeroNavLockEvent } from '@/shared/lib/dom/home-hero-nav-lock';

/**
 * 홈 히어로 섹션이 viewport 안에 보이는 동안 전역 네비게이션 숨김을 잠급니다.
 *
 * nav hide/show 애니메이션에 따라 hero 높이를 실시간으로 바꾸면 하단 공백과 떨림이 생기므로,
 * 히어로 구간에서는 nav를 항상 표시한 상태로 유지하고 레이아웃 높이는 고정값으로 계산합니다.
 * 아주 빠른 스크롤에서도 공백 노출 구간을 줄이기 위해, 히어로가 1px이라도 남아 있으면 lock을 유지합니다.
 */
export const useHomeHeroNavLock = (sectionRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const sectionElement = sectionRef.current;

    if (!sectionElement || typeof window === 'undefined') return;

    const dispatchLockChange = (locked: boolean) => {
      window.dispatchEvent(createHomeHeroNavLockEvent(locked));
    };

    if (typeof IntersectionObserver === 'undefined') {
      dispatchLockChange(true);

      return () => {
        dispatchLockChange(false);
      };
    }

    const intersectionObserver = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        dispatchLockChange(entry?.isIntersecting ?? false);
      },
      {
        threshold: 0,
      },
    );

    intersectionObserver.observe(sectionElement);

    return () => {
      intersectionObserver.disconnect();
      dispatchLockChange(false);
    };
  }, [sectionRef]);
};
