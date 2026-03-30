'use client';

import React from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import {
  type ImageViewerLabels,
  ImageViewerModal,
} from '@/shared/ui/image-viewer/image-viewer-modal';
import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { HomeHeroInteractionHint } from '@/widgets/home-hero-scene/ui/home-hero-interaction-hint';
import { HomeHeroMobileProjectSheet } from '@/widgets/home-hero-scene/ui/home-hero-mobile-project-sheet';

type HomeHeroOverlaysProps = Readonly<{
  imageViewerLabels: ImageViewerLabels;
  imageViewerOpenIndex: number | null;
  isMobileProjectSheetOpen: boolean;
  isProjectLoading?: boolean;
  items: ProjectListItem[];
  onCloseImageViewer: () => void;
  onCloseMobileProjectSheet: () => void;
  onSelectCurrentImage: (currentIndex: number) => void;
  photoItems: HomeHeroImageViewerItem[];
  title: string;
}>;

/**
 * 홈 히어로 위에 겹쳐지는 overlay 계층을 한곳에서 조합합니다.
 *
 * 현재 대상은 세 가지입니다.
 * - 첫 진입 안내 hint
 * - 이미지 뷰어 모달
 * - stacked viewport용 mobile project sheet
 *
 * `HomeHeroScene`에서 overlay 조립 책임을 덜어내고, stage/web UI와 상태 orchestration을 느슨하게 분리하는 것이 목적입니다.
 *
 * @param props 홈 히어로 overlay를 구성하는 상태와 핸들러
 * @returns 홈 히어로 overlay 묶음
 */
export const HomeHeroOverlays = ({
  imageViewerLabels,
  imageViewerOpenIndex,
  isMobileProjectSheetOpen,
  isProjectLoading = false,
  items,
  onCloseImageViewer,
  onCloseMobileProjectSheet,
  onSelectCurrentImage,
  photoItems,
  title,
}: HomeHeroOverlaysProps) => {
  /**
   * 이미지 뷰어에서 현재 이미지를 액자에 반영한 뒤 모달을 닫습니다.
   *
   * 홈 히어로에서는 "선택"이 확정 동작이므로, 선택 이후에도 뷰어를 열어둘 이유가 없습니다.
   * 따라서 반영과 닫힘을 overlay 조립 계층에서 하나의 UX 흐름으로 묶습니다.
   *
   * @param currentIndex 현재 이미지 뷰어가 가리키는 인덱스
   */
  const handleSelectCurrentImage = (currentIndex: number) => {
    onSelectCurrentImage(currentIndex);
    onCloseImageViewer();
  };

  return (
    <>
      <HomeHeroInteractionHint hidden={imageViewerOpenIndex !== null || isMobileProjectSheetOpen} />
      <ImageViewerModal
        initialIndex={imageViewerOpenIndex}
        items={photoItems}
        labels={imageViewerLabels}
        onClose={onCloseImageViewer}
        onSelectCurrentImage={handleSelectCurrentImage}
      />
      <HomeHeroMobileProjectSheet
        isOpen={isMobileProjectSheetOpen}
        isProjectLoading={isProjectLoading}
        items={items}
        onClose={onCloseMobileProjectSheet}
        title={title}
      />
    </>
  );
};
