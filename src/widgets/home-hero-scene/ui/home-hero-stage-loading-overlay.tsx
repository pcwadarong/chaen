'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { LoadingDots } from '@/shared/ui/loading/loading-dots';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type HomeHeroStageLoadingOverlayProps = Readonly<{
  className?: string;
  srLabel: string;
}>;

/**
 * 홈 히어로 3D 자산 준비가 끝날 때까지 stage 위에 고정되는 로딩 오버레이입니다.
 */
export const HomeHeroStageLoadingOverlay = ({
  className,
  srLabel,
}: HomeHeroStageLoadingOverlayProps) => (
  <div className={cx(overlayClass, className)}>
    <div aria-busy="true" aria-live="polite" className={panelClass} role="status">
      <span className={srOnlyClass}>{srLabel}</span>
      <LoadingDots className={loadingDotsClass} />
    </div>
  </div>
);

const overlayClass = css({
  position: 'absolute',
  inset: '0',
  zIndex: '4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 84%, white) 0%, color-mix(in srgb, #5d5bff 92%, black) 100%)]',
  backdropFilter: '[blur(6px)]',
});

const panelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '6',
  py: '5',
});

const loadingDotsClass = css({
  justifySelf: 'center',
});
