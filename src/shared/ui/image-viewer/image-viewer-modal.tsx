'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { Modal } from '@/shared/ui/modal/modal';

type ImageViewerItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

export type ImageViewerLabels = {
  closeAriaLabel: string;
  imageViewerAriaLabel?: string;
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
  const resolvedDialogAriaLabel = useMemo(() => {
    if (!currentItem) return labels.imageViewerAriaLabel?.trim() || 'Image viewer';

    return currentItem.alt.trim() || labels.imageViewerAriaLabel?.trim() || 'Image viewer';
  }, [currentItem, labels.imageViewerAriaLabel]);

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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentIndex(previous => (previous < sanitizedItems.length - 1 ? previous + 1 : 0));
        setZoomLevel(1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex(previous => (previous > 0 ? previous - 1 : sanitizedItems.length - 1));
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, sanitizedItems.length]);

  if (!isOpen || !currentItem) return null;

  return (
    <Modal
      ariaLabel={resolvedDialogAriaLabel}
      closeAriaLabel={labels.closeAriaLabel}
      frameClassName={viewerFrameClass}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className={viewerContentClass}>
        <div className={imageStageClass}>
          <button
            aria-label={labels.previousAriaLabel}
            className={cx(sideButtonClass, sideButtonLeftClass)}
            onClick={() => {
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            type="button"
          >
            ‹
          </button>

          <div className={imageViewportClass}>
            <div className={imageInnerClass}>
              <Image
                alt={currentItem.alt}
                className={viewerImageClass}
                height={1200}
                src={currentItem.src}
                style={{ transform: `scale(${zoomLevel})` }}
                unoptimized={currentItem.unoptimized}
                width={1920}
              />
            </div>
          </div>

          <button
            aria-label={labels.nextAriaLabel}
            className={cx(sideButtonClass, sideButtonRightClass)}
            onClick={() => {
              const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            type="button"
          >
            ›
          </button>

          <div className={zoomDockClass}>
            <button
              aria-label={labels.zoomOutAriaLabel}
              className={dockButtonClass}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev - ZOOM_STEP));
              }}
              type="button"
            >
              -
            </button>
            <span aria-live="polite" className={zoomTextClass}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              aria-label={labels.zoomInAriaLabel}
              className={dockButtonClass}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev + ZOOM_STEP));
              }}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div
          aria-label={labels.thumbnailListAriaLabel}
          className={thumbnailRailClass}
          ref={thumbnailRailRef}
        >
          {sanitizedItems.map((item, index) => {
            const isActive = index === currentIndex;

            return (
              <button
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${
                  item.alt.trim() || labels.imageViewerAriaLabel?.trim() || 'Image viewer'
                } ${index + 1}`}
                key={`${item.src}-${index}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoomLevel(1);
                }}
                ref={node => {
                  thumbnailButtonRefs.current[index] = node;
                }}
                className={cx(
                  thumbnailButtonClass,
                  isActive ? activeThumbnailButtonClass : undefined,
                )}
                type="button"
              >
                <Image
                  alt={item.alt}
                  className={thumbnailImageClass}
                  height={200}
                  src={item.src}
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

const viewerFrameClass = css({
  width: '[min(1280px,100%)]',
  height: '[min(94dvh,100%)]',
});

const viewerContentClass = css({
  width: 'full',
  height: 'full',
  display: 'grid',
  gridTemplateRows: '[1fr auto]',
  gap: '3',
});

const imageStageClass = css({
  position: 'relative',
  minHeight: '0',
  borderRadius: 'lg',
  border: '[1px solid rgb(var(--color-white) / 0.18)]',
  backgroundColor: '[rgb(var(--color-black) / 0.22)]',
  overflow: 'hidden',
});

const imageViewportClass = css({
  width: 'full',
  height: 'full',
  overflow: 'auto',
});

const imageInnerClass = css({
  width: 'full',
  minHeight: 'full',
  display: 'grid',
  placeItems: 'center',
  p: '4',
});

const viewerImageClass = css({
  width: '[min(100%,1120px)]',
  height: 'auto',
  transformOrigin: 'center',
  transition: '[transform 140ms ease]',
});

const sideButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  zIndex: '3',
  width: '[2.6rem]',
  height: '[3.2rem]',
  borderRadius: 'pill',
  border: '[1px solid rgb(var(--color-white) / 0.28)]',
  backgroundColor: '[rgb(var(--color-black) / 0.45)]',
  color: '[rgb(var(--color-white))]',
  fontSize: '32',
  lineHeight: '100',
  transform: '[translateY(-50%)]',
  cursor: 'pointer',
});

const sideButtonLeftClass = css({
  left: '[0.55rem]',
});

const sideButtonRightClass = css({
  right: '[0.55rem]',
});

const zoomDockClass = css({
  position: 'absolute',
  left: '[50%]',
  bottom: '[0.9rem]',
  zIndex: '3',
  transform: '[translateX(-50%)]',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minHeight: '[2.6rem]',
  px: '2',
  py: '1',
  borderRadius: 'pill',
  border: '[1px solid rgb(var(--color-white) / 0.25)]',
  backgroundColor: '[rgb(var(--color-black) / 0.45)]',
});

const dockButtonClass = css({
  minWidth: '[2.15rem]',
  height: '8',
  borderRadius: 'pill',
  border: '[1px solid rgb(var(--color-white) / 0.3)]',
  backgroundColor: '[rgb(var(--color-white) / 0.08)]',
  color: '[rgb(var(--color-white))]',
  fontSize: '16',
  lineHeight: '100',
  cursor: 'pointer',
});

const zoomTextClass = css({
  minWidth: '[3.5rem]',
  textAlign: 'center',
  color: '[rgb(var(--color-gray-200))]',
  fontSize: '14',
  fontVariantNumeric: 'tabular-nums',
});

const thumbnailRailClass = css({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '[max-content]',
  gap: '2',
  overflowX: 'auto',
  pt: '1',
  px: '1',
  pb: '2',
  justifyContent: 'center',
});

const thumbnailButtonClass = css({
  width: '[clamp(84px,13vw,128px)]',
  border: '[1px solid rgb(var(--color-white) / 0.2)]',
  background: 'transparent',
  borderRadius: 'md',
  p: '0',
  overflow: 'hidden',
  opacity: 0.75,
  transform: '[scale(0.96)]',
  transition: '[transform 220ms ease, opacity 220ms ease, border-color 220ms ease]',
  cursor: 'pointer',
});

const activeThumbnailButtonClass = css({
  opacity: 1,
  transform: '[scale(1)]',
  borderColor: '[rgb(var(--color-white) / 0.8)]',
});

const thumbnailImageClass = css({
  width: 'full',
  height: 'auto',
  aspectRatio: '[16 / 9]',
  objectFit: 'cover',
});
