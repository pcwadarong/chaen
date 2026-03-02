'use client';

import Image from 'next/image';
import { type CSSProperties, useState } from 'react';

import {
  type ImageViewerLabels,
  ImageViewerModal,
} from '@/shared/ui/image-viewer/image-viewer-modal';

type WorkDetailMediaItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

type WorkDetailMediaGalleryProps = {
  emptyText: string;
  items: WorkDetailMediaItem[];
  sectionLabel: string;
  viewerLabels: ImageViewerLabels;
};

/**
 * 프로젝트 상세의 미디어 목록과 뷰어 모달을 렌더링합니다.
 */
export const WorkDetailMediaGallery = ({
  emptyText,
  items,
  sectionLabel,
  viewerLabels,
}: WorkDetailMediaGalleryProps) => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <p style={emptyTextStyle}>{emptyText}</p>;
  }

  return (
    <>
      <div aria-label={sectionLabel} role="region" style={mediaSliderStyle}>
        {items.map((media, index) => (
          <figure key={`${media.src}-${index}`} style={mediaItemStyle}>
            <button
              onClick={() => {
                setViewerIndex(index);
              }}
              style={mediaButtonStyle}
              type="button"
            >
              <Image
                alt={media.alt}
                height={1080}
                src={media.src}
                style={mediaImageStyle}
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

const mediaSliderStyle: CSSProperties = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'min(100%, 100%)',
  gap: '0.75rem',
  overflowX: 'auto',
  paddingBottom: '0.3rem',
  scrollSnapType: 'x mandatory',
};

const mediaItemStyle: CSSProperties = {
  margin: 0,
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid rgb(var(--color-border) / 0.2)',
  backgroundColor: 'rgb(var(--color-surface-strong) / 0.36)',
  scrollSnapAlign: 'start',
};

const mediaButtonStyle: CSSProperties = {
  width: '100%',
  display: 'block',
  border: 0,
  padding: 0,
  background: 'transparent',
  cursor: 'zoom-in',
};

const mediaImageStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};

const emptyTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};
