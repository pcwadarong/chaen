'use client';

import { useTranslations } from 'next-intl';
import React, { type ImgHTMLAttributes, useMemo, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { ImageViewerModal } from '@/shared/ui/image-viewer/image-viewer-modal';

type MarkdownImageProps = ImgHTMLAttributes<HTMLImageElement>;

/**
 * 마크다운 본문 이미지를 키보드 접근 가능한 이미지 뷰어 트리거로 렌더링합니다.
 */
export const MarkdownImage = ({
  alt,
  className,
  onClick,
  onKeyDown,
  src,
  ...props
}: MarkdownImageProps) => {
  const t = useTranslations('ImageViewer');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const resolvedAlt = alt ?? '';
  const resolvedSrc = typeof src === 'string' ? src : '';
  const imageViewerLabels = useMemo(
    () => ({
      closeAriaLabel: t('closeAriaLabel'),
      imageViewerAriaLabel: t('imageViewerAriaLabel'),
      nextAriaLabel: t('nextAriaLabel'),
      previousAriaLabel: t('previousAriaLabel'),
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

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={resolvedAlt}
        aria-haspopup="dialog"
        aria-label={openViewerAriaLabel}
        className={cx(markdownInteractiveImageClass, className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        src={resolvedSrc}
        tabIndex={0}
        {...props}
      />
      <ImageViewerModal
        initialIndex={isViewerOpen ? 0 : null}
        items={[{ alt: resolvedAlt, src: resolvedSrc }]}
        labels={imageViewerLabels}
        onClose={() => {
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
