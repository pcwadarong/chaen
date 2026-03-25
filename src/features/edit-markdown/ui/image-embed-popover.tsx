'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import type { EditorContentType } from '@/entities/editor/model/editor-types';
import {
  normalizeEmbedInput,
  uploadImageEmbedSource,
} from '@/features/edit-markdown/model/embed-popover-state';
import { uploadEditorImage } from '@/shared/lib/image/upload-editor-image';
import { Button } from '@/shared/ui/button/button';
import { ImageIcon } from '@/shared/ui/icons/app-icons';
import { ImageSourceField } from '@/shared/ui/image-source-field';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type ImageEmbedPopoverProps = {
  contentType: EditorContentType;
  onApply: (url: string, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 이미지 URL을 받아 markdown 이미지 문법을 삽입하는 팝오버입니다.
 */
export const ImageEmbedPopover = ({
  contentType,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: ImageEmbedPopoverProps) => {
  const [imageInput, setImageInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const normalizedInput = React.useMemo(() => normalizeEmbedInput(imageInput), [imageInput]);

  const handleApply = (closePopover?: ClosePopover) => {
    if (!normalizedInput) return;

    setImageError(null);
    onApply(normalizedInput, closePopover);
    setImageInput('');
  };

  /**
   * 툴바 팝오버에서 이미지를 업로드하고, 삽입 전 검토할 수 있도록 URL 입력값에 채웁니다.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);
    setImageError(null);

    try {
      const { errorMessage, url } = await uploadImageEmbedSource({
        contentType,
        file,
        uploadEditorImage,
      });

      if (url) {
        setImageInput(url);
      }

      if (errorMessage) {
        setImageError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="이미지 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="이미지"
      triggerClassName={triggerClassName}
      triggerContent={<ImageIcon aria-hidden color="text" size="sm" />}
      triggerTooltip="이미지"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <ImageSourceField
            error={imageError ?? undefined}
            fileInputAriaLabel="이미지 파일 업로드"
            inputId="markdown-toolbar-image-url"
            isUploading={isUploading}
            label="이미지"
            onFileChange={handleFileChange}
            onValueChange={value => setImageInput(value)}
            previewAlt="삽입할 이미지 미리보기"
            previewUrl={normalizedInput ?? ''}
            value={imageInput}
          />
          <Button disabled={normalizedInput === null} onClick={() => handleApply(closePopover)}>
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
  minWidth: '[16rem]',
});
