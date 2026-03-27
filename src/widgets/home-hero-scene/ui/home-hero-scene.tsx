'use client';

import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef } from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import {
  type ImageViewerLabels,
  ImageViewerModal,
} from '@/shared/ui/image-viewer/image-viewer-modal';
import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { useHomeHeroNavLock } from '@/widgets/home-hero-scene/model/use-home-hero-nav-lock';
import { useHomeHeroViewportHeightVar } from '@/widgets/home-hero-scene/model/use-home-hero-viewport-height-var';
import { HomeHeroContactButtons } from '@/widgets/home-hero-scene/ui/home-hero-contact-buttons';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';
import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

type HomeHeroSceneProps = {
  readonly interactionDisabledProgressThreshold?: number;
  readonly items: ProjectListItem[];
  readonly photoItems: HomeHeroImageViewerItem[];
  readonly title: string;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
};

const HOME_HERO_FRAME_IMAGE_STORAGE_KEY = 'home-hero:selected-frame-image-src';
const DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD = 0.5;

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = ({
  interactionDisabledProgressThreshold = DEFAULT_INTERACTION_DISABLED_PROGRESS_THRESHOLD,
  items,
  photoItems,
  title,
  triggerRef,
}: HomeHeroSceneProps) => {
  const imageViewerTranslations = useTranslations('ImageViewer');
  const localSectionRef = useRef<HTMLElement>(null);
  const navLockRef = useRef<HTMLDivElement>(null);
  const webUiRef = useRef<HTMLDivElement>(null);
  const blackoutOverlayRef = useRef<HTMLDivElement>(null);
  const defaultFrameImageSrc = photoItems[0]?.src ?? null;
  const [imageViewerOpenIndex, setImageViewerOpenIndex] = React.useState<number | null>(null);
  const [selectedFrameImageSrc, setSelectedFrameImageSrc] = React.useState<string | null>(
    defaultFrameImageSrc,
  );
  const sectionRef = triggerRef ?? localSectionRef;
  const selectedFrameImageIndex = useMemo(
    () => photoItems.findIndex(item => item.src === selectedFrameImageSrc),
    [photoItems, selectedFrameImageSrc],
  );
  const imageViewerLabels = React.useMemo<ImageViewerLabels>(
    () => ({
      actionBarAriaLabel: imageViewerTranslations('actionBarAriaLabel'),
      closeAriaLabel: imageViewerTranslations('closeAriaLabel'),
      fitToScreenAriaLabel: imageViewerTranslations('fitToScreenAriaLabel'),
      imageViewerAriaLabel: imageViewerTranslations('imageViewerAriaLabel'),
      locateSourceAriaLabel: imageViewerTranslations('locateSourceAriaLabel'),
      nextAriaLabel: imageViewerTranslations('nextAriaLabel'),
      previousAriaLabel: imageViewerTranslations('previousAriaLabel'),
      selectForFrameAriaLabel: imageViewerTranslations('selectForFrameAriaLabel'),
      selectForFrameLabel: imageViewerTranslations('selectForFrameLabel'),
      thumbnailListAriaLabel: imageViewerTranslations('thumbnailListAriaLabel'),
      zoomInAriaLabel: imageViewerTranslations('zoomInAriaLabel'),
      zoomOutAriaLabel: imageViewerTranslations('zoomOutAriaLabel'),
    }),
    [imageViewerTranslations],
  );

  useHomeHeroNavLock(navLockRef);
  useHomeHeroViewportHeightVar(sectionRef);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedImageSrc = window.localStorage.getItem(HOME_HERO_FRAME_IMAGE_STORAGE_KEY);

    if (!storedImageSrc) return;
    if (!photoItems.some(item => item.src === storedImageSrc)) return;

    setSelectedFrameImageSrc(storedImageSrc);
  }, [photoItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedFrameImageSrc) return;

    window.localStorage.setItem(HOME_HERO_FRAME_IMAGE_STORAGE_KEY, selectedFrameImageSrc);
  }, [selectedFrameImageSrc]);

  return (
    <section className={sectionClass} id="scene-scroll-container" ref={sectionRef}>
      <div
        aria-hidden="true"
        className={navLockSentinelClass}
        data-testid="home-hero-nav-lock-sentinel"
        ref={navLockRef}
      />
      <div className={stickyWrapperClass}>
        <HomeHeroStage
          blackoutOverlayRef={blackoutOverlayRef}
          interactionDisabledProgressThreshold={interactionDisabledProgressThreshold}
          onOpenImageViewer={() => {
            setImageViewerOpenIndex(selectedFrameImageIndex >= 0 ? selectedFrameImageIndex : 0);
          }}
          selectedFrameImageSrc={selectedFrameImageSrc}
          triggerRef={sectionRef}
          webUiRef={webUiRef}
        />
        <HomeHeroContactButtons />
        <HomeHeroWebUi items={items} title={title} wrapperRef={webUiRef} />
        <div aria-hidden="true" className={blackoutOverlayClass} ref={blackoutOverlayRef} />
      </div>
      <ImageViewerModal
        initialIndex={imageViewerOpenIndex}
        items={photoItems}
        labels={imageViewerLabels}
        onClose={() => {
          setImageViewerOpenIndex(null);
        }}
        onSelectCurrentImage={currentIndex => {
          const nextImageSrc = photoItems[currentIndex]?.src ?? defaultFrameImageSrc;
          setSelectedFrameImageSrc(nextImageSrc);
        }}
      />
    </section>
  );
};

/**
 * 스크롤 타임라인을 위한 공간을 제공하는 바깥 컨테이너입니다.
 * 데스크탑에서는 4배 높이로 스크롤 거리를 만들고, 모바일에서는 뷰포트 높이 그대로입니다.
 */
const sectionClass = css({
  position: 'relative',
  width: 'full',
  boxSizing: 'border-box',
  height: '[var(--home-hero-available-height, 100svh)]',
  overflowX: 'clip',
  _desktopUp: {
    marginTop: '[calc(-1 * var(--global-nav-height, 0px))]',
    height: '[var(--home-hero-scroll-section-height, 100dvh)]',
    overflow: 'clip',
  },
  _tabletDown: {
    width: '[100vw]',
    marginInline: '[calc(50% - 50vw)]',
  },
});

const navLockSentinelClass = css({
  position: 'absolute',
  insetInline: '0',
  top: '0',
  height: '[var(--home-hero-available-height, 100svh)]',
  pointerEvents: 'none',
});

/**
 * CSS sticky로 viewport에 고정되는 내부 컨테이너입니다.
 */
const stickyWrapperClass = css({
  position: 'sticky',
  top: '0',
  zIndex: '1',
  height: '[var(--home-hero-available-height, 100svh)]',
  overflow: 'clip',
  isolation: 'isolate',
  backgroundColor: '[#5d5bff]',
  _desktopUp: {
    height: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});

const blackoutOverlayClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '3',
  pointerEvents: 'none',
  opacity: '0',
  backgroundColor: 'black',
});
