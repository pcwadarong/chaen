'use client';

import dynamic from 'next/dynamic';
import type { RefObject } from 'react';
import { css } from 'styled-system/css';

type HomeHeroStageCanvasProps = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly interactionDisabledProgressThreshold?: number;
  readonly onBrowseProjects?: () => void;
  readonly onOpenImageViewer?: () => void;
  readonly selectedFrameImageSrc?: string | null;
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
export const HomeHeroStage = ({
  blackoutOverlayRef,
  interactionDisabledProgressThreshold,
  onBrowseProjects,
  onOpenImageViewer,
  selectedFrameImageSrc,
  triggerRef,
  webUiRef,
}: HomeHeroStageCanvasProps) => (
  <div className={stageFrameClass}>
    <HomeHeroStageCanvas
      blackoutOverlayRef={blackoutOverlayRef}
      interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
      onBrowseProjects={onBrowseProjects}
      onOpenImageViewer={onOpenImageViewer}
      selectedFrameImageSrc={selectedFrameImageSrc}
      triggerRef={triggerRef}
      webUiRef={webUiRef}
    />
  </div>
);

const stageFrameClass = css({
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  backgroundColor: '[#5d5bff]',
  border: '[1px solid var(--colors-border)]',
  boxShadow: 'floating',
});

const stageFallbackClass = css({
  width: 'full',
  height: 'full',
});
