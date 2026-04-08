'use client';

import React from 'react';
import { css } from 'styled-system/css';

import {
  type ImageViewerLabels,
  ImageViewerModal,
} from '@/shared/ui/image-viewer/image-viewer-modal';

const IMAGE_VIEWER_MODAL_LABELS: ImageViewerLabels = {
  actionBarAriaLabel: '이미지 액션 바',
  closeAriaLabel: '닫기',
  fitToScreenAriaLabel: '화면 맞춤',
  imageViewerAriaLabel: '이미지 뷰어',
  locateSourceAriaLabel: '이미지 위치로 글 이동',
  nextAriaLabel: '다음 이미지',
  previousAriaLabel: '이전 이미지',
  selectForFrameAriaLabel: '액자 이미지로 선택',
  selectForFrameLabel: '이 이미지 선택하기',
  thumbnailListAriaLabel: '썸네일 목록',
  zoomInAriaLabel: '확대',
  zoomOutAriaLabel: '축소',
};

const IMAGE_VIEWER_FIXTURE_ITEMS = [
  { alt: '첫 번째 이미지', src: '/one.jpg' },
  { alt: '두 번째 이미지', src: '/two.jpg' },
];

/**
 * ImageViewerModal의 브라우저 상호작용 계약을 검증하기 위한 fixture입니다.
 */
export const ImageViewerModalE2eFixture = () => {
  const [closeCount, setCloseCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>Image Viewer Modal Fixture</h1>
        <p className={descriptionClass}>
          실제 브라우저에서 keyboard navigation, focus trap, backdrop close를 검증한다.
        </p>
        <div className={actionRowClass}>
          <button
            className={triggerButtonClass}
            onClick={() => {
              setIsOpen(true);
            }}
            type="button"
          >
            이미지 뷰어 열기
          </button>
          <output aria-live="polite" className={statusClass} data-testid="image-viewer-close-count">
            closeCount:{closeCount}
          </output>
        </div>
      </section>
      <div className={fillerClass} />
      <ImageViewerModal
        initialIndex={isOpen ? 0 : null}
        items={IMAGE_VIEWER_FIXTURE_ITEMS}
        labels={IMAGE_VIEWER_MODAL_LABELS}
        onClose={() => {
          setIsOpen(false);
          setCloseCount(previousCount => previousCount + 1);
        }}
      />
    </main>
  );
};

const pageClass = css({
  minHeight: 'svh',
  display: 'grid',
  alignContent: 'start',
  gap: '6',
  px: '4',
  py: '6',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 12%, white) 0%, color-mix(in srgb, #5d5bff 2%, white) 100%)]',
});

const panelClass = css({
  display: 'grid',
  gap: '3',
  maxWidth: '[44rem]',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
});

const titleClass = css({
  fontSize: '[clamp(2rem, 5vw, 3rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  fontWeight: 'semibold',
});

const descriptionClass = css({
  fontSize: 'md',
  color: 'muted',
});

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  alignItems: 'center',
});

const triggerButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '11',
  px: '5',
  borderRadius: 'full',
  backgroundColor: 'text',
  color: 'bg',
  fontWeight: 'medium',
});

const statusClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const fillerClass = css({
  minHeight: '[40rem]',
});
