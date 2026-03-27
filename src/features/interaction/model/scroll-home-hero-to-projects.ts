'use client';

import { viewportMediaQuery } from '@/shared/config/responsive';

const DESKTOP_FRAME_MEDIA_QUERY = viewportMediaQuery.desktopUp;

type ScrollContainer = HTMLElement | Window;

/**
 * 현재 레이아웃에서 홈 hero 자동 스크롤에 사용할 실제 스크롤 컨테이너를 선택합니다.
 */
const resolveScrollContainer = (): ScrollContainer => {
  const isDesktop = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY).matches;

  if (!isDesktop) return window;

  return (
    document.querySelector<HTMLElement>('[data-primary-scroll-region="true"]') ??
    document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]') ??
    window
  );
};

/**
 * 홈 hero section의 끝까지 스크롤해 프로젝트 overlay가 보이는 구간으로 이동합니다.
 */
export const scrollHomeHeroToProjects = (triggerElement: HTMLElement | null) => {
  if (typeof window === 'undefined' || !triggerElement) return;

  const scrollContainer = resolveScrollContainer();
  const triggerRect = triggerElement.getBoundingClientRect();

  if (scrollContainer === window) {
    window.scrollTo({
      behavior: 'smooth',
      top: window.scrollY + triggerRect.top + Math.max(triggerRect.height - window.innerHeight, 0),
    });

    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();

  scrollContainer.scrollTo({
    behavior: 'smooth',
    top:
      scrollContainer.scrollTop +
      (triggerRect.top - containerRect.top) +
      Math.max(triggerRect.height - scrollContainer.clientHeight, 0),
  });
};
