'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import { useState } from 'react';

import {
  type ImageViewerLabels,
  ImageViewerModal,
} from '@/shared/ui/image-viewer/image-viewer-modal';

type ProjectDetailMediaItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

type ProjectDetailMediaGalleryProps = {
  emptyText: string;
  items: ProjectDetailMediaItem[];
  sectionLabel: string;
  viewerLabels: ImageViewerLabels;
};

/**
 * 프로젝트 상세의 미디어 목록과 뷰어 모달을 렌더링합니다.
 */
export const ProjectDetailMediaGallery = ({
  emptyText,
  items,
  sectionLabel,
  viewerLabels,
}: ProjectDetailMediaGalleryProps) => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <p css={emptyTextStyle}>{emptyText}</p>;
  }

  return (
    <>
      <div aria-label={sectionLabel} role="region" css={mediaSliderStyle}>
        {items.map((media, index) => (
          <figure key={`${media.src}-${index}`} css={mediaItemStyle}>
            <button
              onClick={() => {
                setViewerIndex(index);
              }}
              css={mediaButtonStyle}
              type="button"
            >
              <Image
                alt={media.alt}
                height={1080}
                src={media.src}
                css={mediaImageStyle}
                unoptimized={media.unoptimized}
                width={1920}
              />
            </button>
          </figure>
        ))}
      </div>
      <ImageViewerModal
        initialIndex={viewerIndex}
        items={items}
        labels={viewerLabels}
        onClose={() => {
          setViewerIndex(null);
        }}
      />
    </>
  );
};

const mediaSliderStyle = css`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min(100%, 100%);
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: 0.3rem;
  scroll-snap-type: x mandatory;
`;

const mediaItemStyle = css`
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface-strong) / 0.36);
  scroll-snap-align: start;
`;

const mediaButtonStyle = css`
  width: 100%;
  display: block;
  border: 0;
  padding: var(--space-0);
  background: transparent;
  cursor: zoom-in;
`;

const mediaImageStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;
