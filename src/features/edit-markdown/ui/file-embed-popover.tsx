'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { uploadEditorFile } from '@/entities/editor/api/upload-editor-file';
import type { EditorAttachment } from '@/entities/editor/model/editor-attachment';
import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { Button } from '@/shared/ui/button/button';
import { FileIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type FileEmbedPopoverProps = {
  contentType: EditorContentType;
  onApply: (attachment: EditorAttachment, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 첨부 파일을 업로드하고 커스텀 attachment markdown를 삽입하는 팝오버입니다.
 */
export const FileEmbedPopover = ({
  contentType,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: FileEmbedPopoverProps) => {
  const [attachment, setAttachment] = useState<EditorAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 팝오버에서 파일을 업로드하고 삽입 가능한 attachment 상태를 채웁니다.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);
    setAttachmentError(null);

    try {
      const uploadedAttachment = await uploadEditorFile({
        contentType,
        file,
      });

      setAttachment(uploadedAttachment);
    } catch {
      setAttachment(null);
      setAttachmentError('파일 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  /**
   * 업로드된 첨부 파일 메타데이터를 editor 삽입 callback으로 전달합니다.
   */
  const handleApply = (closePopover?: ClosePopover) => {
    if (!attachment) return;

    onApply(attachment, closePopover);
    setAttachment(null);
    setAttachmentError(null);
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="파일 첨부"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="파일 첨부"
      triggerClassName={triggerClassName}
      triggerContent={<FileIcon aria-hidden color="text" size="sm" />}
      triggerTooltip="파일 첨부"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <div className={fieldStackClass}>
            <label className={labelClass} htmlFor="markdown-toolbar-attachment-name">
              첨부 파일
            </label>
            <div className={rowClass}>
              <Input
                id="markdown-toolbar-attachment-name"
                placeholder="업로드한 파일명이 표시됩니다"
                readOnly
                value={attachment?.fileName ?? ''}
              />
              <label className={uploadButtonWrapClass}>
                <span aria-live="polite" className={uploadButtonLabelClass} role="status">
                  {isUploading ? '업로드 중...' : '파일 업로드'}
                </span>
                <input
                  aria-label="첨부 파일 업로드"
                  className={fileInputClass}
                  disabled={isUploading}
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
            </div>
            {attachment ? (
              <p className={metaTextClass}>
                {attachment.contentType} · {Math.max(1, Math.round(attachment.fileSize / 1024))} KB
              </p>
            ) : null}
            {attachmentError ? (
              <p className={errorTextClass} role="alert">
                {attachmentError}
              </p>
            ) : null}
          </div>
          <Button disabled={!attachment} onClick={() => handleApply(closePopover)}>
            삽입
          </Button>
        </div>
      )}
    </Popover>
  );
};

const popoverContentClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '[18rem]',
});

const fieldStackClass = css({
  display: 'grid',
  gap: '2',
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: '[700]',
  color: 'text',
});

const rowClass = css({
  display: 'flex',
  alignItems: 'stretch',
  gap: '3',
  _mobileSmallDown: {
    flexDirection: 'column',
  },
});

const uploadButtonWrapClass = css({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[fit-content]',
  minHeight: '[2.375rem]',
  px: '3',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  bg: 'surface',
  color: 'text',
  cursor: 'pointer',
  flex: 'none',
});

const uploadButtonLabelClass = css({
  fontSize: 'sm',
  fontWeight: '[600]',
});

const fileInputClass = css({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  cursor: 'pointer',
});

const metaTextClass = css({
  fontSize: 'xs',
  color: 'muted',
});

const errorTextClass = css({
  fontSize: 'xs',
  color: 'error',
});
