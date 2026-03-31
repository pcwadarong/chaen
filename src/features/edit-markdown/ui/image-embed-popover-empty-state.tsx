'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { ImageIcon } from '@/shared/ui/icons/app-icons';
import { Textarea } from '@/shared/ui/textarea/textarea';

type ImageEmbedPopoverEmptyStateProps = {
  acceptedFileTypes: string;
  canAddRow: boolean;
  isDragActive: boolean;
  isUploading: boolean;
  pendingUrls: string;
  onAddUrls: () => void;
  onDropzoneDragLeave: () => void;
  onDropzoneDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDropzoneDrop: (event: React.DragEvent<HTMLElement>) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPendingUrlsChange: (value: string) => void;
  urlAddDisabled: boolean;
};

/**
 * 이미지가 아직 없을 때 사용하는 드롭존과 URL 입력 영역입니다.
 *
 * @param props 빈 상태 렌더링과 입력 연결에 필요한 속성입니다.
 * @returns 이미지 삽입 empty state UI를 반환합니다.
 */
export const ImageEmbedPopoverEmptyState = ({
  acceptedFileTypes,
  canAddRow,
  isDragActive,
  isUploading,
  onAddUrls,
  onDropzoneDragLeave,
  onDropzoneDragOver,
  onDropzoneDrop,
  onFileChange,
  onPendingUrlsChange,
  pendingUrls,
  urlAddDisabled,
}: ImageEmbedPopoverEmptyStateProps) => (
  <section className={emptyStateLayoutClass}>
    <label
      className={cx(emptyStateClass, isDragActive ? emptyStateActiveClass : undefined)}
      data-image-empty-dropzone
      onDragLeave={onDropzoneDragLeave}
      onDragOver={onDropzoneDragOver}
      onDrop={onDropzoneDrop}
      role="presentation"
    >
      <input
        accept={acceptedFileTypes}
        aria-label="드롭존 이미지 업로드"
        className={fileInputClass}
        disabled={isUploading || !canAddRow}
        multiple
        onChange={onFileChange}
        type="file"
      />
      <div className={emptyStateInnerClass}>
        <ImageIcon aria-hidden color="muted" size="lg" />
        <div className={emptyStateTitleClass}>이미지를 여기로 끌어다 놓으세요.</div>
        <p className={emptyStateDescriptionClass}>
          클릭하거나 드래그 앤 드롭으로 추가할 수 있습니다.
        </p>
      </div>
    </label>
    <section className={urlPanelClass}>
      <label className={fieldLabelClass} htmlFor="markdown-toolbar-image-url-panel">
        웹 URL 추가
      </label>
      <Textarea
        autoResize={false}
        id="markdown-toolbar-image-url-panel"
        onChange={event => onPendingUrlsChange(event.target.value)}
        placeholder={`https://example.com/image.png\nhttps://example.com/image-2.png`}
        rows={3}
        value={pendingUrls}
      />
      <div className={urlPanelActionRowClass}>
        <p className={metaTextClass}>여러 URL은 한 줄에 하나씩 입력합니다.</p>
        <Button disabled={urlAddDisabled} onClick={onAddUrls} size="sm" tone="white">
          추가
        </Button>
      </div>
    </section>
  </section>
);

const fileInputClass = css({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  cursor: 'pointer',
});

const emptyStateClass = css({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: '72',
  padding: '6',
  textAlign: 'center',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'border',
  backgroundColor: 'surfaceMuted',
  transition: '[background-color 160ms ease, border-color 160ms ease]',
  cursor: 'pointer',
});

const emptyStateActiveClass = css({
  borderColor: 'primary',
  backgroundColor: 'surface',
});

const emptyStateTitleClass = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text',
});

const emptyStateDescriptionClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const emptyStateLayoutClass = css({
  display: 'grid',
  gap: '3',
  gridTemplateColumns: {
    base: '1fr',
    md: '[minmax(0,1fr) minmax(0,1.5fr)]',
  },
  alignItems: 'stretch',
});

const emptyStateInnerClass = css({
  display: 'grid',
  justifyItems: 'center',
  gap: '1',
  maxWidth: '80',
});

const urlPanelClass = css({
  display: 'grid',
  gap: '2',
  padding: '4',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  borderRadius: 'xl',
  backgroundColor: 'surfaceMuted',
  alignContent: 'start',
});

const urlPanelActionRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  flexWrap: 'wrap',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text',
});

const metaTextClass = css({
  fontSize: 'xs',
  color: 'muted',
});
