'use client';

import React, { useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { extractVideoEmbedReference } from '@/features/edit-markdown/model/video-embed';
import { Button } from '@/shared/ui/button/button';
import { YoutubeIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import type { ClosePopover } from '@/shared/ui/popover/popover';
import { Tooltip } from '@/shared/ui/tooltip/tooltip';

type VideoEmbedModalProps = {
  onApply: (videoId: string, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부 영상 삽입 모달입니다.
 * 현재는 YouTube URL만 지원하며, 유효한 URL일 때만 preview와 삽입 액션을 노출합니다.
 *
 * @param props 영상 삽입 트리거와 적용 콜백 구성입니다.
 * @returns 영상 삽입 버튼과 모달 UI를 반환합니다.
 */
export const VideoEmbedModal = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: VideoEmbedModalProps) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const videoReference = useMemo(() => extractVideoEmbedReference(videoUrl), [videoUrl]);
  const videoId = videoReference?.videoId ?? null;

  /**
   * 영상 모달을 열고 남아 있는 tooltip/focus 상태를 정리합니다.
   */
  const handleOpen = () => {
    triggerRef.current?.blur();
    setIsOpen(true);
  };

  /**
   * 유효한 YouTube 영상일 때만 markdown 삽입을 실행합니다.
   */
  const handleApply = () => {
    if (!videoId) return;

    onApply(videoId);
    setVideoUrl('');
    setIsOpen(false);
  };

  return (
    <>
      {isOpen ? (
        <button
          aria-label="영상"
          className={cx(videoTriggerClass, triggerClassName)}
          onClick={handleOpen}
          onMouseDown={onTriggerMouseDown}
          ref={triggerRef}
          type="button"
        >
          <YoutubeIcon aria-hidden color="text" size="sm" />
        </button>
      ) : (
        <Tooltip content="영상" preferredPlacement="top">
          <button
            aria-label="영상"
            className={cx(videoTriggerClass, triggerClassName)}
            onClick={handleOpen}
            onMouseDown={onTriggerMouseDown}
            ref={triggerRef}
            type="button"
          >
            <YoutubeIcon aria-hidden color="text" size="sm" />
          </button>
        </Tooltip>
      )}

      <Modal
        ariaDescribedBy="markdown-toolbar-video-modal-description"
        ariaLabelledBy="markdown-toolbar-video-modal-title"
        closeAriaLabel="영상 삽입 모달 닫기"
        initialFocusRef={inputRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <section className={modalFrameClass}>
          <header className={modalHeaderClass}>
            <div className={headerTextGroupClass}>
              <h2 className={titleClass} id="markdown-toolbar-video-modal-title">
                영상 삽입
              </h2>
              <p className={descriptionClass} id="markdown-toolbar-video-modal-description">
                YouTube URL을 입력해 본문에 영상을 삽입합니다.
              </p>
            </div>
          </header>

          <div className={bodyClass}>
            <section className={previewFrameClass}>
              {videoId ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className={previewIframeClass}
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video preview"
                />
              ) : (
                <div className={previewPlaceholderClass}>
                  유효한 YouTube URL을 입력하면 미리보기가 표시됩니다.
                </div>
              )}
            </section>

            <section className={fieldGroupClass}>
              <div className={fieldClass}>
                <label className={fieldLabelClass} htmlFor="markdown-toolbar-video-url">
                  동영상 URL
                </label>
                <Input
                  id="markdown-toolbar-video-url"
                  onChange={event => setVideoUrl(event.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  ref={inputRef}
                  type="url"
                  value={videoUrl}
                />
              </div>

              <p aria-live="polite" className={helperTextClass} role="status">
                {videoId
                  ? 'YouTube 영상을 삽입할 준비가 되었습니다.'
                  : '현재는 YouTube 링크만 지원합니다.'}
              </p>
            </section>
          </div>

          <footer className={footerClass}>
            <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
              취소
            </Button>
            <Button disabled={!videoId} onClick={handleApply} size="sm">
              삽입
            </Button>
          </footer>
        </section>
      </Modal>
    </>
  );
};

const videoTriggerClass = css({
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '10',
  minWidth: '10',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  color: 'text',
  transition: 'common',
  cursor: 'pointer',
  _hover: {
    backgroundColor: 'surfaceMuted',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const modalFrameClass = css({
  display: 'grid',
  gap: '6',
  width: 'full',
  maxWidth: '4xl',
  paddingX: '8',
  paddingTop: '8',
  paddingBottom: '6',
  backgroundColor: 'surface',
});

const modalHeaderClass = css({
  display: 'grid',
  gap: '2',
});

const headerTextGroupClass = css({
  display: 'grid',
  gap: '2',
  maxWidth: 'xl',
});

const titleClass = css({
  margin: '0',
  fontSize: '4xl',
  fontWeight: 'bold',
  color: 'text',
  letterSpacing: '[-0.02em]',
});

const descriptionClass = css({
  margin: '0',
  fontSize: 'sm',
  color: 'muted',
});

const bodyClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(0,1.2fr) minmax(18rem,0.8fr)]',
  gap: '8',
  paddingY: '5',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
});

const previewFrameClass = css({
  position: 'relative',
  width: 'full',
  overflow: 'hidden',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  backgroundColor: 'surfaceMuted',
  minHeight: '80',
  pt: '[56.25%]',
});

const previewIframeClass = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  border: 'none',
});

const previewPlaceholderClass = css({
  position: 'absolute',
  inset: '0',
  display: 'grid',
  placeItems: 'center',
  paddingX: '6',
  textAlign: 'center',
  fontSize: 'sm',
  color: 'muted',
});

const fieldGroupClass = css({
  display: 'grid',
  alignContent: 'start',
  gap: '4',
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text',
});

const helperTextClass = css({
  margin: '0',
  fontSize: 'xs',
  color: 'muted',
});

const footerClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
});
