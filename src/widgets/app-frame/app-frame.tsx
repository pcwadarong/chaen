import React, { type ReactNode } from 'react';

import {
  appFrameClass,
  appFrameRootClass,
  appFrameScrollViewportClass,
} from '@/widgets/app-frame/app-frame.styles';
import { AppFrameFooter } from '@/widgets/app-frame/app-frame-footer';
import { AppFrameScrollTopButton } from '@/widgets/app-frame/app-frame-scroll-top-button';

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
