'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { css } from 'styled-system/css';

import { SceneLoadingShell } from '@/entities/scene/ui/scene-loading-shell';

/**
 * 홈 라우트 loading 인디케이터를 문서 최상단으로 포털합니다.
 * app frame의 transform / sticky / scroll 레이아웃 영향을 끊어, 로딩 중 위치가 흔들리지 않게 합니다.
 */
export const HomeRouteLoadingOverlay = () => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={overlayClass}>
      <SceneLoadingShell />
    </div>,
    document.body,
  );
};

const overlayClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: 'overlay',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});
