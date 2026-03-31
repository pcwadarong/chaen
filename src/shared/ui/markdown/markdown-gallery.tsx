'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { MarkdownImageViewerItem } from '@/shared/lib/markdown/collect-markdown-images';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownImage } from '@/shared/ui/markdown/markdown-image';

type MarkdownGalleryProps = {
  galleryId: string;
  items: MarkdownImageViewerItem[];
};

/**
 * gallery 내부 이미지의 viewer id를 현재 갤러리 스코프로 다시 부여합니다.
 */
const createScopedViewerItems = ({
  galleryId,
  items,
}: MarkdownGalleryProps): MarkdownImageViewerItem[] =>
  items.map((item, index) => ({
    ...item,
    viewerId: `${galleryId}-image-${index}`,
  }));

/**
 * 현재 스크롤 위치를 기준으로 가장 가까운 슬라이드 인덱스를 계산합니다.
 */
const resolveActiveSlideIndex = (container: HTMLElement, totalCount: number) => {
  if (totalCount <= 1) return 0;

  const slideElements = Array.from(
    container.querySelectorAll<HTMLElement>('[data-markdown-gallery-slide="true"]'),
  );

  if (slideElements.length === 0) return 0;

  const nearestSlide = slideElements.reduce(
    (closest, slide, index) => {
      const distance = Math.abs(slide.offsetLeft - container.scrollLeft);

      if (distance < closest.distance) {
        return {
          distance,
          index,
        };
      }

      return closest;
    },
    {
      distance: Number.POSITIVE_INFINITY,
      index: 0,
    },
  );

  return Math.min(Math.max(nearestSlide.index, 0), totalCount - 1);
};

/**
 * 지정한 슬라이드가 뷰포트 시작점에 맞도록 갤러리를 이동합니다.
 */
const scrollToSlide = (container: HTMLElement, index: number) => {
  const slideElements = Array.from(
    container.querySelectorAll<HTMLElement>('[data-markdown-gallery-slide="true"]'),
  );
  const targetSlide = slideElements[index];

  if (!targetSlide) return;

  container.scrollTo({
    behavior: 'smooth',
    left: targetSlide.offsetLeft,
  });
};

/**
 * markdown gallery 블록을 가로 슬라이더와 이미지 뷰어 트리거 목록으로 렌더링합니다.
 */
export const MarkdownGallery = ({ galleryId, items }: MarkdownGalleryProps) => {
  const scopedViewerItems = createScopedViewerItems({
    galleryId,
    items,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId = 0;

    const syncActiveIndex = () => {
      rafId = 0;
      setActiveIndex(resolveActiveSlideIndex(container, scopedViewerItems.length));
    };

    const handleScroll = () => {
      if (rafId) return;

      rafId = window.requestAnimationFrame(syncActiveIndex);
    };

    syncActiveIndex();
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [scopedViewerItems.length]);

  if (scopedViewerItems.length === 0) return null;

  return (
    <section
      aria-labelledby={titleId}
      className={galleryFrameClass}
      data-markdown-gallery="true"
      data-markdown-gallery-count={scopedViewerItems.length}
    >
      <h2 className={galleryTitleClass} id={titleId}>
        이미지 갤러리
      </h2>
      <div className={galleryViewportClass}>
        <div className={galleryTrackClass} data-markdown-gallery-track="true" ref={containerRef}>
          {scopedViewerItems.map((item, index) => (
            <figure
              className={gallerySlideClass}
              data-markdown-gallery-slide="true"
              key={item.viewerId}
            >
              <MarkdownImage
                alt={item.alt}
                className={galleryImageClass}
                imageIndex={index}
                src={item.src}
                viewerItems={scopedViewerItems}
              />
            </figure>
          ))}
        </div>
        {scopedViewerItems.length > 1 ? (
          <>
            <button
              aria-label="이전 이미지"
              className={cx(galleryNavButtonClass, galleryPrevButtonClass)}
              disabled={activeIndex === 0}
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;

                scrollToSlide(container, Math.max(activeIndex - 1, 0));
              }}
              type="button"
            >
              <ChevronRightIcon
                aria-hidden="true"
                className={galleryPrevIconClass}
                color="text"
                size={28}
              />
            </button>
            <button
              aria-label="다음 이미지"
              className={cx(galleryNavButtonClass, galleryNextButtonClass)}
              disabled={activeIndex === scopedViewerItems.length - 1}
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;

                scrollToSlide(container, Math.min(activeIndex + 1, scopedViewerItems.length - 1));
              }}
              type="button"
            >
              <ChevronRightIcon aria-hidden="true" color="text" size={28} />
            </button>
          </>
        ) : null}
      </div>
      {scopedViewerItems.length > 1 ? (
        <div
          aria-label={`총 ${scopedViewerItems.length}장의 이미지 중 ${activeIndex + 1}번째`}
          aria-valuemax={scopedViewerItems.length}
          aria-valuemin={1}
          aria-valuenow={activeIndex + 1}
          className={galleryProgressClass}
          role="progressbar"
        >
          <div
            className={galleryProgressValueClass}
            style={{
              left: `${(activeIndex / scopedViewerItems.length) * 100}%`,
              width: `${100 / scopedViewerItems.length}%`,
            }}
          />
        </div>
      ) : null}
    </section>
  );
};

const galleryFrameClass = css({
  display: 'grid',
  gap: '3',
});

const galleryTitleClass = css({
  position: 'absolute',
  width: '[1px]',
  height: '[1px]',
  p: '0',
  m: '[-1px]',
  overflow: 'hidden',
  clip: '[rect(0, 0, 0, 0)]',
  whiteSpace: 'nowrap',
  borderWidth: '0',
});

const galleryViewportClass = css({
  position: 'relative',
});

const galleryTrackClass = css({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '[78%]',
  gap: '2',
  overflowX: 'auto',
  overscrollBehaviorX: 'contain',
  scrollSnapType: '[x mandatory]',
  scrollbarWidth: '[thin]',
  '&::-webkit-scrollbar': {
    height: '[0.5rem]',
  },
});

const gallerySlideClass = css({
  position: 'relative',
  display: 'block',
  minWidth: '0',
  margin: '0',
  width: 'full',
  aspectRatio: '[4 / 5]',
  minHeight: {
    base: '72',
    md: '96',
  },
  borderRadius: 'lg',
  backgroundColor: 'surfaceMuted',
  scrollSnapAlign: 'start',
  overflow: 'hidden',
});

const galleryImageClass = css({
  display: 'block',
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

const galleryNavButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '12',
  minHeight: '12',
  borderRadius: 'full',
  color: 'text',
  backgroundColor: 'surface',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'borderStrong',
  boxShadow: 'sm',
  zIndex: '8',
  _hover: {
    backgroundColor: 'surfaceMuted',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    opacity: 0.36,
  },
});

const galleryPrevButtonClass = css({
  left: '0',
});

const galleryNextButtonClass = css({
  right: '0',
});

const galleryPrevIconClass = css({
  transform: 'rotate(180deg)',
});

const galleryProgressClass = css({
  position: 'relative',
  width: 'full',
  height: '1',
  borderRadius: 'full',
  backgroundColor: 'border',
  overflow: 'hidden',
});

const galleryProgressValueClass = css({
  position: 'absolute',
  top: '0',
  height: 'full',
  borderRadius: 'full',
  backgroundColor: 'text',
  transition: '[left 200ms ease, width 200ms ease]',
});
