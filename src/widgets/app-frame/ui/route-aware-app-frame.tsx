'use client';

import React, { type ReactNode } from 'react';
import { css } from 'styled-system/css';

import { usePathname } from '@/i18n/navigation';
import { AppFrame } from '@/widgets/app-frame/ui/app-frame';

type RouteAwareAppFrameProps = {
  children: ReactNode;
  nav: ReactNode;
};

/**
 * 현재 경로가 관리자 영역인지에 따라 AppFrame 적용 여부를 분기합니다.
 */
export const RouteAwareAppFrame = ({ children, nav }: RouteAwareAppFrameProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute) {
    return (
      <div className={adminRootClass}>
        {nav}
        {children}
      </div>
    );
  }

  return (
    <AppFrame>
      {nav}
      {children}
    </AppFrame>
  );
};

const adminRootClass = css({
  width: 'full',
  minHeight: 'dvh',
  background: 'surface',
  _desktopUp: {
    height: 'dvh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
});
