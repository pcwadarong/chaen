import type { RefObject } from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';

export type HomeHeroStageContent = Readonly<{
  items?: ProjectListItem[];
  selectedFrameImageSrc?: string | null;
}>;

export type HomeHeroStageInteraction = Readonly<{
  interactionDisabledProgressThreshold?: number;
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
}>;

export type HomeHeroStageSceneRefs = Readonly<{
  blackoutOverlayRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  webUiContentRef?: RefObject<HTMLDivElement | null>;
  webUiRef: RefObject<HTMLDivElement | null>;
}>;

export type HomeHeroStageProps = Readonly<{
  content?: HomeHeroStageContent;
  interaction?: HomeHeroStageInteraction;
  sceneRefs: HomeHeroStageSceneRefs;
}>;
