'use client';

import dynamic from 'next/dynamic';
import type { CSSProperties } from 'react';

const HomeHeroStageCanvas = dynamic(
  () =>
    import('@/widgets/home-hero-scene/ui/home-hero-stage-canvas').then(
      module => module.HomeHeroStageCanvas,
    ),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" style={stageFallbackStyle} />,
  },
);

/**
 * 홈 히어로 영역의 3D 캔버스 프레임과 로딩 폴백을 제공합니다.
 */
export const HomeHeroStage = () => (
  <div aria-hidden="true" style={stageFrameStyle}>
    <HomeHeroStageCanvas />
  </div>
);

const stageFrameStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: '2rem',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'radial-gradient(circle at 50% 18%, rgb(var(--color-text) / 0.08), transparent 0 32%), linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted)))',
  boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3)',
};

const stageFallbackStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background:
    'radial-gradient(circle at 50% 18%, rgb(var(--color-text) / 0.12), transparent 0 24%), linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted)))',
};
