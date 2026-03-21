'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { Button } from '@/shared/ui/button/button';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';
import { XButton } from '@/shared/ui/x-button/x-button';

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
const IMAGE_NAVIGATION_ANIMATION_MS = 360;
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

type ImageViewerPointerState = {
  x: number;
  y: number;
};

type ImageViewerPinchState = {
  initialDistance: number;
  initialZoomLevel: number;
};

type ImageViewerTransitionDirection = 'next' | 'previous' | null;

type ImageViewerSideControlsProps = {
  nextAriaLabel: string;
  onNext: () => void;
  onPrevious: () => void;
  previousAriaLabel: string;
  stopClickPropagation: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const ImageViewerSideControls = React.memo(
  ({
    nextAriaLabel,
    onNext,
    onPrevious,
    previousAriaLabel,
    stopClickPropagation,
  }: ImageViewerSideControlsProps) => (
    <>
      <Button
        aria-label={previousAriaLabel}
        className={cx(viewerControlButtonClass, sideButtonClass, sideButtonLeftClass)}
        onClick={event => {
          stopClickPropagation(event);
          onPrevious();
        }}
        tone="white"
        type="button"
        variant="ghost"
      >
        <ChevronRightIcon aria-hidden="true" className={sideButtonLeftIconClass} size={28} />
      </Button>

      <Button
        aria-label={nextAriaLabel}
        className={cx(viewerControlButtonClass, sideButtonClass, sideButtonRightClass)}
        onClick={event => {
          stopClickPropagation(event);
          onNext();
        }}
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
 * 활성 포인터 두 개 사이의 거리를 계산합니다.
 */
const getPointerDistance = (points: ImageViewerPointerState[]) => {
  if (points.length < 2) return 0;

  const [firstPoint, secondPoint] = points;
  const deltaX = secondPoint.x - firstPoint.x;
  const deltaY = secondPoint.y - firstPoint.y;

  return Math.hypot(deltaX, deltaY);
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
  const [isMounted, setIsMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [panOffset, setPanOffset] = useState<ImageViewerPanOffset>(DEFAULT_PAN_OFFSET);
  const [transitionDirection, setTransitionDirection] =
    useState<ImageViewerTransitionDirection>(null);
  const [transitionKey, setTransitionKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const activePointersRef = useRef<Map<number, ImageViewerPointerState>>(new Map());
  const dragStateRef = useRef<ImageViewerDragState | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pinchStateRef = useRef<ImageViewerPinchState | null>(null);
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

  /**
   * 지정한 인덱스로 이동하면서 확대 상태를 초기화하고 방향 애니메이션을 적용합니다.
   */
  const navigateToImage = useCallback(
    (nextIndex: number, direction: Exclude<ImageViewerTransitionDirection, null>) => {
      setTransitionDirection(direction);
      setTransitionKey(previousKey => previousKey + 1);
      setCurrentIndex(nextIndex);
      setPanOffset(DEFAULT_PAN_OFFSET);
      setZoomLevel(1);
    },
    [],
  );

  const handlePreviousImage = useCallback(() => {
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
    navigateToImage(nextIndex, 'previous');
  }, [currentIndex, navigateToImage, sanitizedItems.length]);

  const handleNextImage = useCallback(() => {
    const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
    navigateToImage(nextIndex, 'next');
  }, [currentIndex, navigateToImage, sanitizedItems.length]);

  const handleModalClose = useCallback(() => {
    onClose(currentIndex);
  }, [currentIndex, onClose]);

  /**
   * 뷰어 내부 인터랙션 요소 클릭이 backdrop 닫기로 이어지지 않도록 전파를 중단합니다.
   */
  const stopViewerClickPropagation = useCallback((event: React.MouseEvent<Element>) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || initialIndex === null) return;
    setCurrentIndex(initialIndex);
    setPanOffset(DEFAULT_PAN_OFFSET);
    setTransitionDirection(null);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!transitionDirection) return;

    const timeout = window.setTimeout(() => {
      setTransitionDirection(null);
    }, IMAGE_NAVIGATION_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [transitionDirection]);

  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = bodyOverflow;
    };
  }, [isMounted, isOpen]);

  useDialogFocusManagement({
    containerRef: frameRef,
    isEnabled: isOpen && isMounted,
    onEscape: handleModalClose,
  });

  useEffect(() => {
    if (zoomLevel > 1) return;
    activePointersRef.current.clear();
    dragStateRef.current = null;
    pinchStateRef.current = null;
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
        const nextIndex = currentIndex < sanitizedItems.length - 1 ? currentIndex + 1 : 0;
        navigateToImage(nextIndex, 'next');
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
        navigateToImage(nextIndex, 'previous');
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentIndex, isOpen, navigateToImage, sanitizedItems.length]);

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
    if (isInteractiveViewerTarget(event.target)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activePointersRef.current.size >= 2) {
      const pinchDistance = getPointerDistance(Array.from(activePointersRef.current.values()));

      if (pinchDistance > 0) {
        pinchStateRef.current = {
          initialDistance: pinchDistance,
          initialZoomLevel: zoomLevel,
        };
      }

      dragStateRef.current = null;
      setIsDraggingImage(false);
      return;
    }

    if (zoomLevel <= 1) return;

    dragStateRef.current = {
      originOffset: panOffset,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDraggingImage(true);
  };

  /**
   * 확대된 이미지를 포인터 이동량만큼 팬합니다.
   */
  const handleViewportPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (pinchStateRef.current && activePointersRef.current.size >= 2) {
      const nextDistance = getPointerDistance(Array.from(activePointersRef.current.values()));

      if (nextDistance > 0) {
        setZoomLevel(
          clampZoomLevel(
            pinchStateRef.current.initialZoomLevel *
              (nextDistance / pinchStateRef.current.initialDistance),
          ),
        );
      }

      return;
    }

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
    activePointersRef.current.delete(event.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }

    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDraggingImage(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /**
   * 마우스 휠이나 트랙패드 제스처로 확대/축소합니다.
   */
  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (isInteractiveViewerTarget(event.target)) return;

    event.preventDefault();

    setZoomLevel(previousZoomLevel => clampZoomLevel(previousZoomLevel - event.deltaY * 0.0025));
  };

  if (!isMounted || !isOpen || !currentItem) return null;

  return createPortal(
    <div
      className={viewerBackdropClass}
      data-image-viewer-backdrop="true"
      onClick={handleModalClose}
    >
      <div aria-hidden className={topScrimClass} />
      <XButton
        ariaLabel={labels.closeAriaLabel}
        className={viewerCloseButtonClass}
        onClick={event => {
          stopViewerClickPropagation(event);
          handleModalClose();
        }}
      />
      <ImageViewerSideControls
        nextAriaLabel={labels.nextAriaLabel}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        previousAriaLabel={labels.previousAriaLabel}
        stopClickPropagation={stopViewerClickPropagation}
      />
      <div
        aria-label={resolvedDialogAriaLabel}
        aria-modal="true"
        className={viewerFrameClass}
        ref={frameRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={viewerContentClass}>
          <div className={imageStageClass}>
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
              onWheel={handleViewportWheel}
              ref={viewportRef}
            >
              <div
                className={cx(
                  imageInnerClass,
                  transitionDirection === 'next' ? nextTransitionImageClass : undefined,
                  transitionDirection === 'previous' ? previousTransitionImageClass : undefined,
                )}
                data-transition-direction={transitionDirection ?? undefined}
                key={`${currentItem.src}-${transitionKey}`}
                onClick={stopViewerClickPropagation}
              >
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
                onClick={stopViewerClickPropagation}
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
            onClick={stopViewerClickPropagation}
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
                      if (index === currentIndex) return;
                      navigateToImage(index, index > currentIndex ? 'next' : 'previous');
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
      </div>
    </div>,
    document.body,
  );
};

/* Styles */

const viewerBackdropClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '1200',
  backgroundColor: '[rgb(15 23 42 / 0.86)]',
  display: 'grid',
  placeItems: 'center',
  p: '4',
});

const viewerFrameClass = css({
  position: 'relative',
  width: '[min(1280px,100%)]',
  height: '[min(94dvh,100%)]',
  borderRadius: '3xl',
  overflow: 'hidden',
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

const nextTransitionImageClass = css({
  animation: `[image-viewer-slide-next ${IMAGE_NAVIGATION_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)]`,
});

const previousTransitionImageClass = css({
  animation: `[image-viewer-slide-previous ${IMAGE_NAVIGATION_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)]`,
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
  overflowY: 'hidden',
});

const thumbnailRailTrackClass = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'center',
  minWidth: '[max-content]',
  alignItems: 'stretch',
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
