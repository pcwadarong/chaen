'use client';

import Image from 'next/image';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { Modal } from '@/shared/ui/modal/modal';

type ImageViewerItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

export type ImageViewerLabels = {
  closeAriaLabel: string;
  nextAriaLabel: string;
  previousAriaLabel: string;
  thumbnailListAriaLabel: string;
  zoomInAriaLabel: string;
  zoomOutAriaLabel: string;
};

type ImageViewerModalProps = {
  initialIndex: number | null;
  items: ImageViewerItem[];
  labels: ImageViewerLabels;
  onClose: () => void;
};

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/**
 * 이미지 뷰어의 확대/축소 배율을 안전 범위 내로 제한합니다.
 */
const clampZoomLevel = (zoomLevel: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel));

/**
 * 이미지 뷰어 모달을 렌더링합니다.
 */
export const ImageViewerModal = ({
  initialIndex,
  items,
  labels,
  onClose,
}: ImageViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const thumbnailRailRef = useRef<HTMLDivElement | null>(null);
  const thumbnailButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const sanitizedItems = useMemo(
    () =>
      items.map(item => ({
        ...item,
        src: createImageViewerUrl(item.src),
      })),
    [items],
  );

  const isOpen = initialIndex !== null && sanitizedItems.length > 0;
  const currentItem = useMemo(
    () => sanitizedItems[currentIndex] ?? null,
    [currentIndex, sanitizedItems],
  );

  useEffect(() => {
    if (!isOpen || initialIndex === null) return;

    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const rail = thumbnailRailRef.current;
    const activeButton = thumbnailButtonRefs.current[currentIndex];

    if (!rail || !activeButton) return;

    const targetLeft = activeButton.offsetLeft - (rail.clientWidth - activeButton.clientWidth) / 2;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetLeft));

    rail.scrollTo({
      behavior: 'smooth',
      left: nextScrollLeft,
    });
  }, [currentIndex, isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <Modal
      closeAriaLabel={labels.closeAriaLabel}
      frameStyle={viewerFrameStyle}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div style={viewerContentStyle}>
        <div style={imageStageStyle}>
          <button
            aria-label={labels.previousAriaLabel}
            onClick={() => {
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            style={{ ...sideButtonStyle, left: '0.55rem' }}
            type="button"
          >
            ‹
          </button>

          <div style={imageViewportStyle}>
            <div style={imageInnerStyle}>
              <Image
                alt={currentItem.alt}
                height={1200}
                src={currentItem.src}
                style={{
                  ...viewerImageStyle,
                  transform: `scale(${zoomLevel})`,
                }}
                unoptimized={currentItem.unoptimized}
                width={1920}
              />
            </div>
          </div>

          <button
            aria-label={labels.nextAriaLabel}
            onClick={() => {
              const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            style={{ ...sideButtonStyle, right: '0.55rem' }}
            type="button"
          >
            ›
          </button>

          <div style={zoomDockStyle}>
            <button
              aria-label={labels.zoomOutAriaLabel}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev - ZOOM_STEP));
              }}
              style={dockButtonStyle}
              type="button"
            >
              -
            </button>
            <span aria-live="polite" style={zoomTextStyle}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              aria-label={labels.zoomInAriaLabel}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev + ZOOM_STEP));
              }}
              style={dockButtonStyle}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div
          aria-label={labels.thumbnailListAriaLabel}
          ref={thumbnailRailRef}
          style={thumbnailRailStyle}
        >
          {sanitizedItems.map((item, index) => {
            const isActive = index === currentIndex;

            return (
              <button
                aria-label={`${index + 1}`}
                key={`${item.src}-${index}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoomLevel(1);
                }}
                ref={node => {
                  thumbnailButtonRefs.current[index] = node;
                }}
                style={{
                  ...thumbnailButtonStyle,
                  ...(isActive ? activeThumbnailButtonStyle : null),
                }}
                type="button"
              >
                <Image
                  alt={item.alt}
                  height={200}
                  src={item.src}
                  style={thumbnailImageStyle}
                  unoptimized={item.unoptimized}
                  width={320}
                />
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

const viewerFrameStyle: CSSProperties = {
  width: 'min(1280px, 100%)',
  height: 'min(94dvh, 100%)',
};

const viewerContentStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateRows: '1fr auto',
  gap: '0.85rem',
};

const imageStageStyle: CSSProperties = {
  position: 'relative',
  minHeight: 0,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(255 255 255 / 0.18)',
  backgroundColor: 'rgb(0 0 0 / 0.22)',
  overflow: 'hidden',
};

const imageViewportStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'auto',
};

const imageInnerStyle: CSSProperties = {
  width: '100%',
  minHeight: '100%',
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
};

const viewerImageStyle: CSSProperties = {
  width: 'min(100%, 1120px)',
  height: 'auto',
  transformOrigin: 'center',
  transition: 'transform 140ms ease',
};

const sideButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  zIndex: 3,
  width: '2.6rem',
  height: '3.2rem',
  borderRadius: '999px',
  border: '1px solid rgb(255 255 255 / 0.28)',
  backgroundColor: 'rgb(0 0 0 / 0.45)',
  color: 'rgb(255 255 255)',
  fontSize: '2rem',
  lineHeight: 1,
  transform: 'translateY(-50%)',
  cursor: 'pointer',
};

const zoomDockStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: '0.9rem',
  zIndex: 3,
  transform: 'translateX(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  minHeight: '2.6rem',
  padding: '0.3rem 0.55rem',
  borderRadius: '999px',
  border: '1px solid rgb(255 255 255 / 0.25)',
  backgroundColor: 'rgb(0 0 0 / 0.45)',
};

const dockButtonStyle: CSSProperties = {
  minWidth: '2.15rem',
  height: '2rem',
  borderRadius: '999px',
  border: '1px solid rgb(255 255 255 / 0.3)',
  backgroundColor: 'rgb(255 255 255 / 0.08)',
  color: 'rgb(255 255 255)',
  fontSize: '1rem',
  lineHeight: 1,
  cursor: 'pointer',
};

const zoomTextStyle: CSSProperties = {
  minWidth: '3.5rem',
  textAlign: 'center',
  color: 'rgb(235 235 235)',
  fontSize: '0.9rem',
  fontVariantNumeric: 'tabular-nums',
};

const thumbnailRailStyle: CSSProperties = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'max-content',
  gap: '0.6rem',
  overflowX: 'auto',
  padding: '0.15rem 0.25rem 0.4rem',
  justifyContent: 'center',
};

const thumbnailButtonStyle: CSSProperties = {
  width: 'clamp(84px, 13vw, 128px)',
  border: '1px solid rgb(255 255 255 / 0.2)',
  background: 'transparent',
  borderRadius: 'var(--radius-md)',
  padding: 0,
  overflow: 'hidden',
  opacity: 0.75,
  transform: 'scale(0.96)',
  transition: 'transform 220ms ease, opacity 220ms ease, border-color 220ms ease',
  cursor: 'pointer',
};

const activeThumbnailButtonStyle: CSSProperties = {
  opacity: 1,
  transform: 'scale(1)',
  borderColor: 'rgb(255 255 255 / 0.8)',
};

const thumbnailImageStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};
