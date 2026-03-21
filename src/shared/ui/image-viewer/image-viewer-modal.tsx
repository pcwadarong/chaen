'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  onClose: (currentIndex: number) => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
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

type ImageViewerSideControlsProps = {
  nextAriaLabel: string;
  onNext: () => void;
  onPrevious: () => void;
  previousAriaLabel: string;
};

const ImageViewerSideControls = React.memo(
  ({ nextAriaLabel, onNext, onPrevious, previousAriaLabel }: ImageViewerSideControlsProps) => (
    <>
      <Button
        aria-label={previousAriaLabel}
        className={cx(viewerControlButtonClass, sideButtonClass, sideButtonLeftClass)}
        onClick={onPrevious}
        tone="white"
        type="button"
        variant="ghost"
      >
        <ChevronRightIcon aria-hidden="true" className={sideButtonLeftIconClass} size={28} />
      </Button>

      <Button
        aria-label={nextAriaLabel}
        className={cx(viewerControlButtonClass, sideButtonClass, sideButtonRightClass)}
        onClick={onNext}
        tone="white"
        type="button"
        variant="ghost"
      >
        <ChevronRightIcon aria-hidden="true" size={28} />
      </Button>
    </>
  ),
);

ImageViewerSideControls.displayName = 'ImageViewerSideControls';

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
 * 이벤트 타깃이 뷰어 내부 인터랙션 요소인지 판별합니다.
 */
const isInteractiveViewerTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest('button, a, input, textarea, select, summary, [role="button"]'));

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

  const handlePreviousImage = useCallback(() => {
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
    setCurrentIndex(nextIndex);
    setPanOffset(DEFAULT_PAN_OFFSET);
    setZoomLevel(1);
  }, [currentIndex, sanitizedItems.length]);

  const handleNextImage = useCallback(() => {
    const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIndex);
    setPanOffset(DEFAULT_PAN_OFFSET);
    setZoomLevel(1);
  }, [currentIndex, sanitizedItems.length]);

  const handleModalClose = useCallback(() => {
    onClose(currentIndex);
  }, [currentIndex, onClose]);

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

    rail.scrollTo({ behavior: 'smooth', left: nextScrollLeft });
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentIndex(prev => (prev < sanitizedItems.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : sanitizedItems.length - 1));
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
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
    if (isInteractiveViewerTarget(event.target)) return;

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
      onClose={handleModalClose}
    >
      <div className={viewerContentClass}>
        <div aria-hidden className={topScrimClass} />
        <div className={imageStageClass}>
          <ImageViewerSideControls
            nextAriaLabel={labels.nextAriaLabel}
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
            previousAriaLabel={labels.previousAriaLabel}
          />
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
                ref={imageRef}
                src={currentItem.src}
                style={{
                  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                }}
              />
            </div>

            <div
              className={zoomDockClass}
              onPointerDown={event => {
                event.stopPropagation();
              }}
            >
              <button
                aria-label={labels.zoomOutAriaLabel}
                className={dockButtonClass}
                onClick={() => setZoomLevel(prev => clampZoomLevel(prev - ZOOM_STEP))}
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
                onClick={() => setZoomLevel(prev => clampZoomLevel(prev + ZOOM_STEP))}
                type="button"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div
          aria-label={labels.thumbnailListAriaLabel}
          className={thumbnailRailClass}
          ref={thumbnailRailRef}
        >
          <div className={thumbnailRailTrackClass}>
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
                  <img
                    alt={item.alt}
                    className={thumbnailImageClass}
                    draggable={false}
                    loading="lazy"
                    src={item.src}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* Styles */

const viewerFrameClass = css({
  width: 'screen',
  height: 'dvh',
  overflow: 'hidden',
  margin: '-4',
});

const viewerContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  height: 'full',
  position: 'relative',
});

const topScrimClass = css({
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: '[120px]',
  background: '[linear-gradient(to bottom, rgb(15 23 42 / 0.72) 0%, transparent 100%)]',
  zIndex: '5',
  pointerEvents: 'none',
});

const imageStageClass = css({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  minHeight: '0',
  alignItems: 'center',
});

const imageViewportClass = css({
  flex: '1',
  width: 'full',
  minHeight: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
});

const zoomedImageViewportClass = css({
  cursor: 'grab',
  touchAction: 'none',
  overflow: 'hidden',
});

const draggingImageViewportClass = css({
  cursor: 'grabbing',
});

const imageInnerClass = css({
  width: 'full',
  height: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: '4',
});

const viewerImageClass = css({
  maxWidth: 'full',
  maxHeight: 'full',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
  willChange: 'transform',
  transition: '[transform 140ms ease-out]',
  userSelect: 'none',
});

const viewerCloseButtonClass = css({
  position: 'fixed',
  top: '4',
  right: '4',
  zIndex: '10',
  color: 'white',
});

const viewerControlButtonClass = css({
  color: 'white',
  backgroundColor: '[rgb(15 23 42 / 0.52)]',
  borderRadius: 'full',
  zIndex: '8',
  _hover: {
    backgroundColor: '[rgb(15 23 42 / 0.64)]',
  },
});

const sideButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  transform: 'translateY(-50%)',
});

const sideButtonLeftClass = css({ left: '4' });
const sideButtonRightClass = css({ right: '4' });
const sideButtonLeftIconClass = css({ transform: 'rotate(180deg)' });

const zoomDockClass = css({
  position: 'absolute',
  bottom: '6',
  left: '[50%]',
  transform: '[translateX(-50%)]',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
  py: '1.5',
  borderRadius: 'full',
  backgroundColor: '[rgb(15 23 42 / 0.75)]',
  zIndex: '10',
});

const dockButtonClass = css({
  width: '8',
  height: '8',
  borderRadius: 'full',
  color: 'white',
  cursor: 'pointer',
  backgroundColor: '[rgb(255 255 255 / 0.1)]',
  _hover: { backgroundColor: '[rgba(255, 255, 255, 0.2)]' },
});

const zoomTextClass = css({
  minWidth: '12',
  textAlign: 'center',
  color: 'zinc.200',
  fontSize: 'sm',
});

const thumbnailRailClass = css({
  width: 'full',
  overflowX: 'auto',
  mb: '4',
  pb: '4',
  px: '4',
});

const thumbnailRailTrackClass = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'center',
  minWidth: '[max-content]',
});

const thumbnailButtonClass = css({
  width: '[clamp(80px, 12vw, 120px)]',
  aspectRatio: '[16 / 9]',
  borderRadius: 'md',
  overflow: 'hidden',
  transition: '[all 0.2s]',
  border: '[2px solid transparent]',
  _focusVisible: {
    outline: '[4px solid var(--colors-primary)]',
    outlineOffset: '[2px]',
  },
});

const activeThumbnailButtonClass = css({
  borderColor: 'primary',
  transform: 'scale(1.05)',
});

const thumbnailImageClass = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});
