'use client';

import { useTranslations } from 'next-intl';
import React, { type ImgHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { MarkdownImageViewerItem } from '@/shared/lib/markdown/collect-markdown-images';
import { ImageViewerModal } from '@/shared/ui/image-viewer/image-viewer-modal';

type MarkdownImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  imageIndex?: number;
  viewerItems?: MarkdownImageViewerItem[];
};

const requestNextPaint = (callback: () => void) => {
  if (typeof window === 'undefined') {
    callback();
    return 0;
  }

  return window.requestAnimationFrame(callback);
};

/**
 * 현재 이미지가 속한 독립 스크롤 영역을 우선 찾아 복귀 위치를 계산합니다.
 */
const resolveScrollContainer = (targetImage: HTMLElement) =>
  targetImage.closest<HTMLElement>(
    '[data-primary-scroll-region="true"], [data-scroll-region="true"]',
  );

/**
 * 대상 이미지가 보이도록 가장 가까운 스크롤 영역을 중앙 기준으로 이동합니다.
 */
const scrollImageIntoView = (targetImage: HTMLElement) => {
  const scrollContainer = resolveScrollContainer(targetImage);

  if (!scrollContainer) {
    targetImage.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });
    return;
  }

  const targetRect = targetImage.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop +
    (targetRect.top - containerRect.top) -
    Math.max((containerRect.height - targetRect.height) / 2, 0);

  scrollContainer.scrollTo({
    top: Math.max(nextTop, 0),
    behavior: 'auto',
  });
};

/**
 * 마크다운 본문 이미지를 키보드 접근 가능한 이미지 뷰어 트리거로 렌더링합니다.
 */
export const MarkdownImage = ({
  alt,
  className,
  imageIndex = 0,
  onClick,
  onKeyDown,
  src,
  viewerItems,
  ...props
}: MarkdownImageProps) => {
  const t = useTranslations('ImageViewer');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [pendingScrollTargetId, setPendingScrollTargetId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resolvedAlt = alt ?? '';
  const resolvedSrc = typeof src === 'string' ? src : '';
  const resolvedViewerItems =
    viewerItems && viewerItems.length > 0
      ? viewerItems
      : [{ alt: resolvedAlt, src: resolvedSrc, viewerId: 'markdown-image-0' }];
  const viewerItemId = resolvedViewerItems[imageIndex]?.viewerId ?? `markdown-image-${imageIndex}`;
  const imageViewerLabels = useMemo(
    () => ({
      actionBarAriaLabel: t('actionBarAriaLabel'),
      closeAriaLabel: t('closeAriaLabel'),
      fitToScreenAriaLabel: t('fitToScreenAriaLabel'),
      imageViewerAriaLabel: t('imageViewerAriaLabel'),
      locateSourceAriaLabel: t('locateSourceAriaLabel'),
      nextAriaLabel: t('nextAriaLabel'),
      previousAriaLabel: t('previousAriaLabel'),
      selectForFrameAriaLabel: t('selectForFrameAriaLabel'),
      selectForFrameLabel: t('selectForFrameLabel'),
      thumbnailListAriaLabel: t('thumbnailListAriaLabel'),
      zoomInAriaLabel: t('zoomInAriaLabel'),
      zoomOutAriaLabel: t('zoomOutAriaLabel'),
    }),
    [t],
  );
  const openViewerAriaLabel = resolvedAlt
    ? `${resolvedAlt} · ${t('openAriaLabel')}`
    : t('openAriaLabel');

  /**
   * 링크 안 이미지까지 포함해 기본 이동을 막고 이미지 뷰어만 엽니다.
   */
  const openViewer = (
    event: React.MouseEvent<HTMLImageElement> | React.KeyboardEvent<HTMLImageElement>,
  ) => {
    if (!resolvedSrc) return;

    event.preventDefault();
    event.stopPropagation();
    setIsViewerOpen(true);
  };

  /**
   * 마크다운 이미지 클릭 시 원본 뷰어를 엽니다.
   */
  const handleClick = (event: React.MouseEvent<HTMLImageElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    openViewer(event);
  };

  /**
   * Enter/Space 키로도 동일하게 이미지 뷰어를 열 수 있게 합니다.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLImageElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key !== 'Enter' && event.key !== ' ') return;

    openViewer(event);
  };

  useEffect(() => {
    if (isViewerOpen || !pendingScrollTargetId) return;

    const targetViewerId = pendingScrollTargetId;
    let innerFrameId = 0;
    const outerFrameId = requestNextPaint(() => {
      innerFrameId = requestNextPaint(() => {
        const targetImage =
          targetViewerId === viewerItemId
            ? imageRef.current
            : (document.querySelector(
                `[data-markdown-viewer-id="${targetViewerId}"]`,
              ) as HTMLImageElement | null);

        if (targetImage) {
          scrollImageIntoView(targetImage);
        }

        setPendingScrollTargetId(null);
      });
    });

    return () => {
      if (typeof window === 'undefined') return;
      window.cancelAnimationFrame(outerFrameId);
      window.cancelAnimationFrame(innerFrameId);
    };
  }, [isViewerOpen, pendingScrollTargetId, viewerItemId]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={resolvedAlt}
        aria-haspopup="dialog"
        aria-label={openViewerAriaLabel}
        className={cx(markdownInteractiveImageClass, className)}
        data-markdown-viewer-id={viewerItemId}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        ref={imageRef}
        role="button"
        src={resolvedSrc}
        tabIndex={0}
        {...props}
      />
      <ImageViewerModal
        initialIndex={isViewerOpen ? imageIndex : null}
        items={resolvedViewerItems}
        labels={imageViewerLabels}
        onClose={() => {
          setIsViewerOpen(false);
        }}
        onLocateSource={currentIndex => {
          const targetViewerId = resolvedViewerItems[currentIndex]?.viewerId ?? viewerItemId;
          setPendingScrollTargetId(targetViewerId);
          setIsViewerOpen(false);
        }}
      />
    </>
  );
};

const markdownInteractiveImageClass = css({
  cursor: 'zoom-in',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[4px]',
  },
});
