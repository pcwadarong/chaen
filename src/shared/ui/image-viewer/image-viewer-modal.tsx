'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';
import { Modal } from '@/shared/ui/modal/modal';

type ImageViewerItem = {
  alt: string;
  src: string;
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
const DEFAULT_PAN_OFFSET = { x: 0, y: 0 } as const;

type ImageViewerPanOffset = {
  x: number;
  y: number;
};

type ImageViewerPanBoundsInput = {
  imageHeight: number;
  imageWidth: number;
  nextOffset: ImageViewerPanOffset;
  viewportHeight: number;
  viewportWidth: number;
  zoomLevel: number;
};

type ImageViewerDragState = {
  originOffset: ImageViewerPanOffset;
  pointerId: number;
  startX: number;
  startY: number;
};

/**
 * 이미지 뷰어의 확대/축소 배율을 안전 범위 내로 제한합니다.
 */
const clampZoomLevel = (zoomLevel: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel));

/**
 * 현재 뷰포트와 이미지 크기를 기준으로 드래그 가능한 이동 범위를 제한합니다.
 */
const clampPanOffset = ({
  imageHeight,
  imageWidth,
  nextOffset,
  viewportHeight,
  viewportWidth,
  zoomLevel,
}: ImageViewerPanBoundsInput): ImageViewerPanOffset => {
  if (zoomLevel <= 1) return DEFAULT_PAN_OFFSET;

  const maxOffsetX = Math.max((imageWidth * zoomLevel - viewportWidth) / 2, 0);
  const maxOffsetY = Math.max((imageHeight * zoomLevel - viewportHeight) / 2, 0);

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
  };
};

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
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [panOffset, setPanOffset] = useState<ImageViewerPanOffset>(DEFAULT_PAN_OFFSET);
  const [zoomLevel, setZoomLevel] = useState(1);
  const dragStateRef = useRef<ImageViewerDragState | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const thumbnailRailRef = useRef<HTMLDivElement | null>(null);
  const thumbnailButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
    setPanOffset(DEFAULT_PAN_OFFSET);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (zoomLevel > 1) return;

    dragStateRef.current = null;
    setIsDraggingImage(false);
    setPanOffset(DEFAULT_PAN_OFFSET);
  }, [zoomLevel]);

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

  /**
   * 현재 레이아웃 기준으로 다음 pan offset을 안전 범위로 보정합니다.
   */
  const getClampedPanOffset = (nextOffset: ImageViewerPanOffset) => {
    const imageElement = imageRef.current;
    const viewportElement = viewportRef.current;

    if (!imageElement || !viewportElement) return DEFAULT_PAN_OFFSET;

    return clampPanOffset({
      imageHeight: imageElement.clientHeight,
      imageWidth: imageElement.clientWidth,
      nextOffset,
      viewportHeight: viewportElement.clientHeight,
      viewportWidth: viewportElement.clientWidth,
      zoomLevel,
    });
  };

  /**
   * 확대 상태에서 포인터 드래그를 시작합니다.
   */
  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragStateRef.current = {
      originOffset: panOffset,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingImage(true);
  };

  /**
   * 확대된 이미지를 포인터 이동량만큼 팬합니다.
   */
  const handleViewportPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextOffset = getClampedPanOffset({
      x: dragState.originOffset.x + (event.clientX - dragState.startX),
      y: dragState.originOffset.y + (event.clientY - dragState.startY),
    });

    setPanOffset(nextOffset);
  };

  /**
   * 팬 제스처를 종료하고 포인터 캡처를 해제합니다.
   */
  const handleViewportPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDraggingImage(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <Modal
      ariaLabel={resolvedDialogAriaLabel}
      closeAriaLabel={labels.closeAriaLabel}
      closeButtonClassName={viewerCloseButtonClass}
      frameClassName={viewerFrameClass}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className={viewerContentClass}>
        <div className={imageStageClass}>
          <Button
            aria-label={labels.previousAriaLabel}
            className={cx(viewerControlButtonClass, sideButtonClass, sideButtonLeftClass)}
            onClick={() => {
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            tone="white"
            type="button"
            variant="ghost"
          >
            <ChevronRightIcon
              aria-hidden="true"
              className={sideButtonLeftIconClass}
              color="current"
              size={36}
            />
          </Button>

          <div
            className={cx(
              imageViewportClass,
              zoomLevel > 1 ? zoomedImageViewportClass : undefined,
              isDraggingImage ? draggingImageViewportClass : undefined,
            )}
            data-image-viewer-viewport="true"
            onPointerCancel={handleViewportPointerEnd}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerEnd}
            ref={viewportRef}
          >
            <div className={imageInnerClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={currentItem.alt}
                className={viewerImageClass}
                data-image-viewer-image="true"
                draggable={false}
                height={1200}
                ref={imageRef}
                src={currentItem.src}
                style={{
                  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                }}
                width={1920}
              />
            </div>
          </div>

          <Button
            aria-label={labels.nextAriaLabel}
            className={cx(viewerControlButtonClass, sideButtonClass, sideButtonRightClass)}
            onClick={() => {
              const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            tone="white"
            type="button"
            variant="ghost"
          >
            <ChevronRightIcon aria-hidden="true" color="current" size={36} />
          </Button>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.alt}
                  className={thumbnailImageClass}
                  draggable={false}
                  height={200}
                  loading="lazy"
                  src={item.src}
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
  border: '[1px solid rgb(255 255 255 / 0.18)]',
  backgroundColor: '[rgb(15 23 42 / 0.22)]',
  overflow: 'hidden',
});

const viewerControlButtonClass = css({
  color: '[var(--colors-white)]',
  backgroundColor: 'transparent',
  borderColor: 'transparent',
  minWidth: '[2.75rem]',
  minHeight: '[2.75rem]',
  px: '0',
  _hover: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    opacity: 0.8,
  },
  _focusVisible: {
    outline: '[2px solid rgb(255 255 255 / 0.92)]',
    outlineOffset: '[2px]',
  },
});

const viewerCloseButtonClass = css({
  color: '[var(--colors-white)]',
});

const imageViewportClass = css({
  width: 'full',
  height: 'full',
  overflow: 'hidden',
});

const zoomedImageViewportClass = css({
  cursor: 'grab',
  touchAction: 'none',
});

const draggingImageViewportClass = css({
  cursor: 'grabbing',
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
  userSelect: 'none',
  willChange: 'transform',
});

const sideButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  zIndex: '3',
  transform: '[translateY(-50%)]',
});

const sideButtonLeftClass = css({
  left: '[0.55rem]',
});

const sideButtonLeftIconClass = css({
  transform: 'rotate(180deg)',
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
  borderRadius: 'full',
  border: '[1px solid rgb(255 255 255 / 0.25)]',
  backgroundColor: '[rgb(15 23 42 / 0.45)]',
});

const dockButtonClass = css({
  minWidth: '[2.15rem]',
  height: '8',
  borderRadius: 'full',
  border: '[1px solid rgb(255 255 255 / 0.3)]',
  backgroundColor: '[rgb(255 255 255 / 0.08)]',
  color: '[var(--colors-white)]',
  fontSize: 'md',
  lineHeight: 'none',
  cursor: 'pointer',
});

const zoomTextClass = css({
  minWidth: '[3.5rem]',
  textAlign: 'center',
  color: '[var(--colors-zinc-200)]',
  fontSize: 'sm',
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
  border: '[1px solid rgb(255 255 255 / 0.2)]',
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
  borderColor: '[rgb(255 255 255 / 0.8)]',
});

const thumbnailImageClass = css({
  width: 'full',
  height: 'auto',
  aspectRatio: '[16 / 9]',
  objectFit: 'cover',
});
