import React, { type ReactNode } from 'react';
import { css } from 'styled-system/css';

import { AppFrameFooter } from '@/widgets/app-frame/ui/app-frame-footer';
import { AppFrameScrollTopButton } from '@/widgets/app-frame/ui/app-frame-scroll-top-button';

type AppFrameProps = {
  children: ReactNode;
};

/**
 * 데스크톱에서는 앱 전체를 중앙 프레임 안에 렌더링하고,
 * 좁은 화면에서는 프레임을 해제해 기존처럼 화면 전체를 사용합니다.
 */
export const AppFrame = ({ children }: AppFrameProps) => (
  <div className={appFrameRootClass}>
    <div className={appFrameClass}>
      <div className={`${appFrameScrollViewportClass} group`} data-app-scroll-viewport="true">
        {children}
        <AppFrameFooter />
      </div>
      <AppFrameScrollTopButton />
    </div>
  </div>
);

const appFrameRootClass = css({
  minHeight: '[100dvh]',
  '@media (min-width: 961px)': {
    p: '[1.25rem]',
  },
});

const appFrameClass = css({
  width: 'full',
  minHeight: '[100dvh]',
  mx: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'surface',
  '@media (min-width: 961px)': {
    width: '[min(1280px, calc(100vw - 2.5rem))]',
    height: '[calc(100dvh - 2.5rem)]',
    minHeight: '0',
    overflow: 'hidden',
    border: '[1px solid var(--colors-border)]',
    borderRadius: '[2rem]',
    boxShadow: 'floating',
    backdropFilter: '[blur(24px) saturate(120%)]',
    transform: 'translateZ(0)',
  },
});

const appFrameScrollViewportClass = css({
  flex: '[1 1 auto]',
  minHeight: '0',
  '@media (min-width: 961px)': {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    scrollbarGutter: 'stable',
    '&:has([data-page-scroll-mode="independent"])': {
      overflowY: 'hidden',
      scrollbarGutter: 'auto',
    },
  },
});
