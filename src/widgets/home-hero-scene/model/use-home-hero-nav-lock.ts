'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

import { createHomeHeroNavLockEvent } from '@/shared/lib/dom/home-hero-nav-lock';

/**
 * 홈 히어로 첫 화면 안전 구간이 viewport 안에 보이는 동안 전역 네비게이션 숨김을 잠급니다.
 *
 * nav hide/show 애니메이션에 따라 hero 높이를 실시간으로 바꾸면 하단 공백과 떨림이 생기므로,
 * 첫 화면 안전 구간에서는 nav를 항상 표시한 상태로 유지하고 레이아웃 높이는 고정값으로 계산합니다.
 * 이후 hero 스크롤 구간에서는 다른 페이지처럼 방향 기반 hide/show가 다시 동작해야 하므로,
 * 전체 section이 아니라 상단 sentinel만 관찰해 lock 범위를 첫 화면으로 한정합니다.
 */
export const useHomeHeroNavLock = (lockRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const lockElement = lockRef.current;

    if (!lockElement || typeof window === 'undefined') return;

    const viewportRoot =
      lockElement.closest<HTMLElement>('[data-app-scroll-viewport="true"]') ?? null;

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
        root: viewportRoot,
        threshold: 0,
      },
    );

    intersectionObserver.observe(lockElement);

    return () => {
      intersectionObserver.disconnect();
      dispatchLockChange(false);
    };
  }, [lockRef]);
};
