'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { LoadingDots } from '@/shared/ui/loading/loading-dots';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type SceneLoadingShellProps = Readonly<{
  className?: string;
}>;

/**
 * 3D 씬 코드 분할 또는 GLB 로딩 중에 먼저 보이는 공통 shell입니다.
 * 실제 장면과 비슷한 프레임을 먼저 렌더해 빈 화면이나 깜빡임을 줄입니다.
 */
export const SceneLoadingShell = ({ className }: SceneLoadingShellProps) => (
  <div aria-live="polite" className={cx(wrapperClass, className)} role="status">
    <span className={srOnlyClass}>Loading 3D scene</span>
    <div aria-hidden="true" className={panelClass}>
      <LoadingDots />
    </div>
  </div>
);

const wrapperClass = css({
  width: 'full',
  height: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6',
});

const panelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '6',
  py: '5',
});
