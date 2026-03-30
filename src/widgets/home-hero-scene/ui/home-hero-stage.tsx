'use client';

import dynamic from 'next/dynamic';
import type { RefObject } from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { SceneLoadingShell } from '@/entities/scene/ui/scene-loading-shell';
import { HOME_HERO_STAGE_BACKGROUND } from '@/widgets/home-hero-scene/model/home-hero-scene-theme';

type HomeHeroStageCanvasProps = {
  readonly blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  readonly interactionDisabledProgressThreshold?: number;
  readonly items?: ProjectListItem[];
  readonly onBrowseProjects?: () => void;
  readonly onOpenImageViewer?: () => void;
  readonly selectedFrameImageSrc?: string | null;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly webUiContentRef?: RefObject<HTMLDivElement | null>;
  readonly webUiRef: RefObject<HTMLDivElement | null>;
};

const HomeHeroStageCanvas = dynamic<HomeHeroStageCanvasProps>(
  () =>
    import('@/widgets/home-hero-scene/ui/home-hero-stage-canvas').then(
      module => module.HomeHeroStageCanvas,
    ),
  {
    ssr: false,
    loading: () => <SceneLoadingShell className={stageFallbackClass} />,
  },
);

/**
 * 홈 히어로 영역의 3D 캔버스 프레임과 로딩 폴백을 제공합니다.
 */
export const HomeHeroStage = ({
  blackoutOverlayRef,
  interactionDisabledProgressThreshold,
  items,
  onBrowseProjects,
  onOpenImageViewer,
  selectedFrameImageSrc,
  triggerRef,
  webUiContentRef,
  webUiRef,
}: HomeHeroStageCanvasProps) => (
  <div className={stageFrameClass}>
    <HomeHeroStageCanvas
      blackoutOverlayRef={blackoutOverlayRef}
      interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
      items={items}
      onBrowseProjects={onBrowseProjects}
      onOpenImageViewer={onOpenImageViewer}
      selectedFrameImageSrc={selectedFrameImageSrc}
      triggerRef={triggerRef}
      webUiContentRef={webUiContentRef}
      webUiRef={webUiRef}
    />
  </div>
);

const stageFrameClass = css({
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  backgroundColor: `[${HOME_HERO_STAGE_BACKGROUND}]`,
  border: '[1px solid var(--colors-border)]',
  boxShadow: 'floating',
});

const stageFallbackClass = css({
  width: 'full',
  height: 'full',
  backgroundColor: `[${HOME_HERO_STAGE_BACKGROUND}]`,
});
