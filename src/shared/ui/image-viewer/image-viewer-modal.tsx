'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

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
      <div css={viewerContentStyle}>
        <div css={imageStageStyle}>
          <button
            aria-label={labels.previousAriaLabel}
            onClick={() => {
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : sanitizedItems.length - 1;
              setCurrentIndex(nextIndex);
              setZoomLevel(1);
            }}
            css={[
              sideButtonStyle,
              css`
                left: 0.55rem;
              `,
            ]}
            type="button"
          >
            ‹
          </button>

          <div css={imageViewportStyle}>
            <div css={imageInnerStyle}>
              <Image
                alt={currentItem.alt}
                height={1200}
                src={currentItem.src}
                css={[
                  viewerImageStyle,
                  css`
                    transform: scale(${zoomLevel});
                  `,
                ]}
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
            css={[
              sideButtonStyle,
              css`
                right: 0.55rem;
              `,
            ]}
            type="button"
          >
            ›
          </button>

          <div css={zoomDockStyle}>
            <button
              aria-label={labels.zoomOutAriaLabel}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev - ZOOM_STEP));
              }}
              css={dockButtonStyle}
              type="button"
            >
              -
            </button>
            <span aria-live="polite" css={zoomTextStyle}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              aria-label={labels.zoomInAriaLabel}
              onClick={() => {
                setZoomLevel(prev => clampZoomLevel(prev + ZOOM_STEP));
              }}
              css={dockButtonStyle}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div
          aria-label={labels.thumbnailListAriaLabel}
          ref={thumbnailRailRef}
          css={thumbnailRailStyle}
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
                css={[thumbnailButtonStyle, isActive && activeThumbnailButtonStyle]}
                type="button"
              >
                <Image
                  alt={item.alt}
                  height={200}
                  src={item.src}
                  css={thumbnailImageStyle}
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

const viewerFrameStyle = css`
  width: min(1280px, 100%);
  height: min(94dvh, 100%);
`;

const viewerContentStyle = css`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0.85rem;
`;

const imageStageStyle = css`
  position: relative;
  min-height: 0;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(255 255 255 / 0.18);
  background-color: rgb(0 0 0 / 0.22);
  overflow: hidden;
`;

const imageViewportStyle = css`
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const imageInnerStyle = css`
  width: 100%;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 1rem;
`;

const viewerImageStyle = css`
  width: min(100%, 1120px);
  height: auto;
  transform-origin: center;
  transition: transform 140ms ease;
`;

const sideButtonStyle = css`
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 2.6rem;
  height: 3.2rem;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.28);
  background-color: rgb(0 0 0 / 0.45);
  color: rgb(255 255 255);
  font-size: 2rem;
  line-height: 1;
  transform: translateY(-50%);
  cursor: pointer;
`;

const zoomDockStyle = css`
  position: absolute;
  left: 50%;
  bottom: 0.9rem;
  z-index: 3;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.6rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.25);
  background-color: rgb(0 0 0 / 0.45);
`;

const dockButtonStyle = css`
  min-width: 2.15rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.3);
  background-color: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
`;

const zoomTextStyle = css`
  min-width: 3.5rem;
  text-align: center;
  color: rgb(235 235 235);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
`;

const thumbnailRailStyle = css`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 0.15rem 0.25rem 0.4rem;
  justify-content: center;
`;

const thumbnailButtonStyle = css`
  width: clamp(84px, 13vw, 128px);
  border: 1px solid rgb(255 255 255 / 0.2);
  background: transparent;
  border-radius: var(--radius-md);
  padding: 0;
  overflow: hidden;
  opacity: 0.75;
  transform: scale(0.96);
  transition:
    transform 220ms ease,
    opacity 220ms ease,
    border-color 220ms ease;
  cursor: pointer;
`;

const activeThumbnailButtonStyle = css`
  opacity: 1;
  transform: scale(1);
  border-color: rgb(255 255 255 / 0.8);
`;

const thumbnailImageStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;
