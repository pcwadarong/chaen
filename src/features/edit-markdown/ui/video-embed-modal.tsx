'use client';

import React, { useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { uploadEditorVideo } from '@/entities/editor/api/upload-editor-video';
import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { EDITOR_VIDEO_FILE_INPUT_ACCEPT } from '@/entities/editor/model/editor-video-policy';
import { extractVideoEmbedReference } from '@/features/edit-markdown/model/video-embed';
import { Button } from '@/shared/ui/button/button';
import { YoutubeIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import type { ClosePopover } from '@/shared/ui/popover/popover';
import { Tooltip } from '@/shared/ui/tooltip/tooltip';

type VideoEmbedModalProps = {
  contentType: EditorContentType;
  onApply: (
    payload: {
      provider: 'upload' | 'youtube';
      src?: string;
      videoId?: string;
    },
    closePopover?: ClosePopover,
  ) => void;
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
  contentType,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: VideoEmbedModalProps) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoReference = useMemo(() => extractVideoEmbedReference(videoUrl), [videoUrl]);
  const videoId = videoReference?.provider === 'youtube' ? videoReference.videoId : null;
  const previewMode = uploadedVideoUrl ? 'upload' : videoId ? 'youtube' : null;

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
    if (uploadedVideoUrl) {
      onApply({
        provider: 'upload',
        src: uploadedVideoUrl,
      });
      setUploadedVideoUrl(null);
      setVideoUrl('');
      setErrorMessage(null);
      setIsOpen(false);
      return;
    }

    if (!videoId) return;

    onApply({
      provider: 'youtube',
      videoId,
    });
    setVideoUrl('');
    setUploadedVideoUrl(null);
    setErrorMessage(null);
    setIsOpen(false);
  };

  /**
   * 실제 영상 파일을 업로드하고 upload provider preview를 준비합니다.
   *
   * @param event 영상 파일 input 변경 이벤트입니다.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploadedUrl = await uploadEditorVideo({
        contentType,
        file,
      });

      setUploadedVideoUrl(uploadedUrl);
      setVideoUrl('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Video upload failed');
    } finally {
      setIsUploading(false);
    }
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
                YouTube URL 입력 또는 영상 파일 업로드로 본문에 영상을 삽입합니다.
              </p>
            </div>
          </header>

          <div className={bodyClass}>
            <section className={previewFrameClass}>
              {previewMode === 'upload' && uploadedVideoUrl ? (
                <video
                  className={previewUploadedVideoClass}
                  controls
                  preload="metadata"
                  src={uploadedVideoUrl}
                />
              ) : previewMode === 'youtube' && videoId ? (
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
                  YouTube URL을 입력하거나 영상 파일을 업로드하면 미리보기가 표시됩니다.
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
                  onChange={event => {
                    setVideoUrl(event.target.value);
                    if (uploadedVideoUrl) {
                      setUploadedVideoUrl(null);
                    }
                  }}
                  placeholder="https://youtube.com/watch?v=..."
                  ref={inputRef}
                  type="url"
                  value={videoUrl}
                />
              </div>

              <div className={fieldClass}>
                <span className={fieldLabelClass}>영상 업로드</span>
                <label className={uploadButtonWrapClass}>
                  <span aria-live="polite" className={uploadButtonLabelClass} role="status">
                    {isUploading ? '업로드 중...' : '영상 파일 선택'}
                  </span>
                  <input
                    accept={EDITOR_VIDEO_FILE_INPUT_ACCEPT}
                    aria-label="영상 업로드"
                    className={fileInputClass}
                    disabled={isUploading}
                    onChange={handleFileChange}
                    type="file"
                  />
                </label>
              </div>

              <p aria-live="polite" className={helperTextClass} role="status">
                {errorMessage
                  ? errorMessage
                  : uploadedVideoUrl
                    ? '업로드된 영상을 삽입할 준비가 되었습니다.'
                    : videoId
                      ? '동영상을 삽입할 준비가 되었습니다.'
                      : '현재는 YouTube 링크 또는 업로드 영상 파일을 지원합니다.'}
              </p>
            </section>
          </div>

          <footer className={footerClass}>
            <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
              취소
            </Button>
            <Button disabled={!uploadedVideoUrl && !videoId} onClick={handleApply} size="sm">
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

const previewUploadedVideoClass = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  objectFit: 'contain',
  backgroundColor: 'black',
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

const uploadButtonWrapClass = css({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '10',
  width: 'auto',
  px: '3',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  backgroundColor: 'surface',
  color: 'text',
  cursor: 'pointer',
  transition: 'common',
  _hover: {
    borderColor: 'borderStrong',
  },
  _focusWithin: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const uploadButtonLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const fileInputClass = css({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  cursor: 'pointer',
});

const footerClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
});
