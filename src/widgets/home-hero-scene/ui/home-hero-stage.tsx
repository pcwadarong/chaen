'use client';

import dynamic from 'next/dynamic';
import type { RefObject } from 'react';
import { css } from 'styled-system/css';

type HomeHeroStageCanvasProps = {
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

const HomeHeroStageCanvas = dynamic<HomeHeroStageCanvasProps>(
  () =>
    import('@/widgets/home-hero-scene/ui/home-hero-stage-canvas').then(
      module => module.HomeHeroStageCanvas,
    ),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className={stageFallbackClass} />,
  },
);

/**
 * 홈 히어로 영역의 3D 캔버스 프레임과 로딩 폴백을 제공합니다.
 */
export const HomeHeroStage = ({ triggerRef, webUiRef }: HomeHeroStageCanvasProps) => (
  <div aria-hidden="true" className={stageFrameClass}>
    <HomeHeroStageCanvas triggerRef={triggerRef} webUiRef={webUiRef} />
  </div>
);

const stageFrameClass = css({
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  border: '[1px solid var(--colors-border)]',
  background:
    '[radial-gradient(circle at 50% 18%, rgb(148 163 184 / 0.22), transparent 0 32%), linear-gradient(180deg, var(--colors-surface), var(--colors-surface-muted))]',
  boxShadow: '[inset 0 1px 0 rgb(255 255 255 / 0.3)]',
});

const stageFallbackClass = css({
  width: 'full',
  height: 'full',
  background:
    '[radial-gradient(circle at 50% 18%, rgb(148 163 184 / 0.3), transparent 0 24%), linear-gradient(180deg, var(--colors-surface), var(--colors-surface-muted))]',
});
