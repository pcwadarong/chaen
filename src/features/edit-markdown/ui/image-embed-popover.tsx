'use client';

import React, { useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { EditorContentType } from '@/entities/editor/model/editor-types';
import {
  normalizeEmbedInput,
  normalizeEmbedInputList,
  uploadImageEmbedSource,
} from '@/features/edit-markdown/model/embed-popover-state';
import {
  ACCEPTED_IMAGE_FILE_TYPES,
  ACCEPTED_IMAGE_FORMAT_LABEL,
  createImageRow,
  getDuplicateRowIds,
  getFilledImageRows,
  type ImageInputRow,
  MAX_IMAGE_EMBED_ITEMS,
  mergeImageRows,
  reorderRows,
  resolvePreviewImageSrc,
} from '@/features/edit-markdown/model/image-embed-popover-state';
import { ImageEmbedPopoverEditor } from '@/features/edit-markdown/ui/image-embed-popover-editor';
import { ImageEmbedPopoverEmptyState } from '@/features/edit-markdown/ui/image-embed-popover-empty-state';
import { uploadEditorImageAdapter } from '@/features/edit-markdown-adapter';
import { Button } from '@/shared/ui/button/button';
import { ImageIcon } from '@/shared/ui/icons/app-icons';
import { Modal } from '@/shared/ui/modal/modal';
import type { ClosePopover } from '@/shared/ui/popover/popover';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { Tooltip } from '@/shared/ui/tooltip/tooltip';

type ImageEmbedPopoverProps = {
  contentType: EditorContentType;
  onApply: (
    payload: {
      items: Array<{
        altText: string;
        url: string;
      }>;
      mode: 'gallery' | 'individual';
    },
    closePopover?: ClosePopover,
  ) => void;
  onUploadImage?: typeof uploadEditorImageAdapter;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * 이미지 입력 row를 기반으로 개별 이미지 또는 슬라이드 삽입 payload를 만드는 모달입니다.
 *
 * @param props 이미지 삽입 모달 구성을 위한 속성입니다.
 * @returns 이미지 삽입 트리거와 modal UI를 반환합니다.
 */
export const ImageEmbedPopover = ({
  contentType,
  onApply,
  onUploadImage = uploadEditorImageAdapter,
  onTriggerMouseDown,
  triggerClassName,
}: ImageEmbedPopoverProps) => {
  const nextRowIdRef = useRef(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const emptyStateUrlInputRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedUrlInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<ImageInputRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUrls, setPendingUrls] = useState('');
  const [isUrlPanelOpen, setIsUrlPanelOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMobileListCollapsed, setIsMobileListCollapsed] = useState(false);

  const isEmptyState = rows.length === 0;
  const filledRows = useMemo(() => getFilledImageRows(rows), [rows]);
  const nonEmptyRowCount = filledRows.length;
  const duplicateRowIds = useMemo(() => getDuplicateRowIds(rows), [rows]);
  const hasDuplicateUrls = duplicateRowIds.size > 0;
  const canAddRow = nonEmptyRowCount < MAX_IMAGE_EMBED_ITEMS;
  const selectedRow = rows.find(row => row.id === selectedRowId) ?? rows[0] ?? null;
  const selectedPreviewUrl = resolvePreviewImageSrc(selectedRow?.url ?? '');
  const isAddUrlsDisabled = normalizeEmbedInputList(pendingUrls).length === 0;

  /**
   * row 배열을 부분 수정합니다.
   *
   * @param rowId 수정할 row id입니다.
   * @param patch 반영할 URL/alt 변경값입니다.
   */
  const updateRow = (rowId: string, patch: Partial<Pick<ImageInputRow, 'alt' | 'url'>>) => {
    setRows(currentRows => currentRows.map(row => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  /**
   * 현재 입력 row 목록을 원하는 삽입 모드로 전달하고 모달을 닫습니다.
   *
   * @param mode 개별 이미지 또는 슬라이드 삽입 모드입니다.
   */
  const handleApply = (mode: 'gallery' | 'individual') => {
    if (filledRows.length === 0 || hasDuplicateUrls) return;

    setErrorMessage(null);
    onApply({
      items: filledRows.map(row => ({
        altText: row.altText,
        url: row.url,
      })),
      mode,
    });
    setRows([]);
    setSelectedRowId(null);
    setPendingUrls('');
    setIsUrlPanelOpen(false);
    setIsMobileListCollapsed(false);
    setIsOpen(false);
  };

  /**
   * 업로드하거나 드롭한 여러 이미지를 입력 행에 채웁니다.
   *
   * @param files 추가할 파일 목록입니다.
   */
  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > MAX_IMAGE_EMBED_ITEMS) {
      setErrorMessage(`이미지는 최대 ${MAX_IMAGE_EMBED_ITEMS}개까지 한 번에 고를 수 있습니다.`);
      return;
    }

    const nextMaxLength = nonEmptyRowCount + files.length;

    if (nextMaxLength > MAX_IMAGE_EMBED_ITEMS) {
      setErrorMessage(`이미지는 최대 ${MAX_IMAGE_EMBED_ITEMS}개까지 넣을 수 있습니다.`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploadedResults = await Promise.all(
        files.map(file =>
          uploadImageEmbedSource({
            contentType,
            file,
            uploadEditorImage: onUploadImage,
          }),
        ),
      );
      const nextRows = files.flatMap((file, index) => {
        const uploadedUrl = uploadedResults[index]?.url;

        if (!uploadedUrl) return [];

        return [
          {
            ...createImageRow(nextRowIdRef),
            alt: file.name,
            url: uploadedUrl,
          },
        ];
      });

      setRows(currentRows => mergeImageRows(currentRows, nextRows).slice(0, MAX_IMAGE_EMBED_ITEMS));

      if (nextRows[0]) {
        setSelectedRowId(nextRows[0].id);
      }
      setIsMobileListCollapsed(false);

      if (uploadedResults.some(result => result.errorMessage)) {
        setErrorMessage('일부 이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 파일 입력 변경 시 업로드를 시작합니다.
   *
   * @param event 파일 input 변경 이벤트입니다.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    await handleUploadFiles(files);
    event.target.value = '';
  };

  /**
   * URL 추가 패널에서 입력한 URL을 이미지 행으로 추가합니다.
   */
  const handleAddUrls = () => {
    const normalizedUrls = normalizeEmbedInputList(pendingUrls);

    if (normalizedUrls.length === 0) return;

    if (nonEmptyRowCount + normalizedUrls.length > MAX_IMAGE_EMBED_ITEMS) {
      setErrorMessage(`이미지는 최대 ${MAX_IMAGE_EMBED_ITEMS}개까지 넣을 수 있습니다.`);
      return;
    }

    const nextRows = normalizedUrls.map(url => ({
      ...createImageRow(nextRowIdRef),
      alt: '',
      url,
    }));

    setRows(currentRows => mergeImageRows(currentRows, nextRows).slice(0, MAX_IMAGE_EMBED_ITEMS));
    setSelectedRowId(nextRows[0]?.id ?? null);
    setPendingUrls('');
    setIsUrlPanelOpen(false);
    setIsMobileListCollapsed(false);
    setErrorMessage(null);
  };

  /**
   * 지정한 입력 행을 삭제합니다.
   *
   * @param rowId 삭제할 row id입니다.
   */
  const handleRemoveRow = (rowId: string) => {
    setRows(currentRows => {
      const nextRows = currentRows.filter(row => row.id !== rowId);

      if (selectedRowId === rowId) {
        setSelectedRowId(nextRows[0]?.id ?? null);
      }

      if (nextRows.length === 0) {
        setIsMobileListCollapsed(false);
      }

      return nextRows;
    });
  };

  /**
   * 선택된 입력 행의 순서를 한 칸 이동합니다.
   *
   * @param rowId 이동할 row id입니다.
   * @param direction 이동 방향입니다.
   */
  const handleMoveRow = (rowId: string, direction: 'down' | 'up') => {
    setRows(currentRows => reorderRows(currentRows, rowId, direction));
    setSelectedRowId(rowId);
  };

  /**
   * 선택된 이미지를 단일 업로드로 교체합니다.
   *
   * @param event 교체할 파일 input 변경 이벤트입니다.
   */
  const handleReplaceSelectedRowImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !selectedRow) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await uploadImageEmbedSource({
        contentType,
        file,
        uploadEditorImage: onUploadImage,
      });

      if (!result.url) {
        setErrorMessage(result.errorMessage ?? '이미지 업로드에 실패했습니다.');
        return;
      }

      updateRow(selectedRow.id, {
        alt: normalizeEmbedInput(selectedRow.alt) ?? file.name,
        url: result.url,
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 빈 상태 드롭존 위로 파일이 올라왔을 때 기본 브라우저 동작을 막고 활성 상태를 표시합니다.
   *
   * @param event 드래그 오버 이벤트입니다.
   */
  const handleDropzoneDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  /**
   * 빈 상태 드롭존에서 드래그가 벗어나면 활성 상태를 정리합니다.
   */
  const handleDropzoneDragLeave = () => {
    setIsDragActive(false);
  };

  /**
   * 빈 상태 드롭존에 파일을 놓으면 여러 장 업로드 흐름으로 연결합니다.
   *
   * @param event 드롭 이벤트입니다.
   */
  const handleDropzoneDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    await handleUploadFiles(files);
  };

  const triggerButton = (
    <Button
      aria-label="이미지"
      className={cx(triggerButtonClass, triggerClassName)}
      onClick={event => {
        event.currentTarget.blur();
        setIsOpen(true);
        setIsMobileListCollapsed(false);
      }}
      onMouseDown={event => {
        event.preventDefault();
        onTriggerMouseDown?.(event);
      }}
      ref={triggerRef}
      size="sm"
      tone="white"
      type="button"
      variant="ghost"
    >
      <ImageIcon aria-hidden color="text" size="sm" />
    </Button>
  );

  return (
    <>
      {isOpen ? triggerButton : <Tooltip content="이미지">{triggerButton}</Tooltip>}
      <Modal
        ariaLabel="이미지 삽입"
        closeAriaLabel="이미지 삽입 닫기"
        initialFocusRef={isEmptyState ? emptyStateUrlInputRef : selectedUrlInputRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div className={modalContentClass}>
          <header className={modalHeaderClass}>
            <div className={headerTopRowClass}>
              <h2 className={modalTitleClass}>이미지 삽입</h2>
              {!isEmptyState ? (
                <div className={headerButtonGroupClass}>
                  <label className={uploadButtonWrapClass}>
                    <span aria-live="polite" className={uploadButtonLabelClass} role="status">
                      {isUploading ? '업로드 중...' : '여러 장 업로드'}
                    </span>
                    <input
                      accept={ACCEPTED_IMAGE_FILE_TYPES}
                      aria-label="이미지 파일 업로드"
                      className={fileInputClass}
                      disabled={isUploading || !canAddRow}
                      multiple
                      onChange={handleFileChange}
                      type="file"
                    />
                  </label>
                  <Button
                    disabled={!canAddRow}
                    onClick={() => setIsUrlPanelOpen(current => !current)}
                    size="sm"
                    tone="white"
                  >
                    URL 추가
                  </Button>
                </div>
              ) : null}
            </div>
            <p className={metaTextClass}>허용 형식: {ACCEPTED_IMAGE_FORMAT_LABEL}</p>
          </header>

          <div className={modalScrollableContentClass}>
            {isEmptyState ? (
              <ImageEmbedPopoverEmptyState
                acceptedFileTypes={ACCEPTED_IMAGE_FILE_TYPES}
                canAddRow={canAddRow}
                errorMessage={errorMessage}
                isDragActive={isDragActive}
                isUploading={isUploading}
                onAddUrls={handleAddUrls}
                onDropzoneDragLeave={handleDropzoneDragLeave}
                onDropzoneDragOver={handleDropzoneDragOver}
                onDropzoneDrop={handleDropzoneDrop}
                onFileChange={handleFileChange}
                onPendingUrlsChange={setPendingUrls}
                pendingUrls={pendingUrls}
                urlInputRef={emptyStateUrlInputRef}
                urlAddDisabled={isAddUrlsDisabled}
              />
            ) : (
              <>
                {isUrlPanelOpen ? (
                  <section className={urlPanelClass}>
                    <label className={fieldLabelClass} htmlFor="markdown-toolbar-image-url-panel">
                      웹 URL 추가
                    </label>
                    <Textarea
                      autoResize={false}
                      id="markdown-toolbar-image-url-panel"
                      onChange={event => setPendingUrls(event.target.value)}
                      placeholder={`https://example.com/image.png\nhttps://example.com/image-2.png`}
                      rows={3}
                      value={pendingUrls}
                    />
                    <div className={urlPanelActionRowClass}>
                      <p className={metaTextClass}>여러 URL은 한 줄에 하나씩 입력합니다.</p>
                      <div className={headerButtonGroupClass}>
                        <Button
                          onClick={() => setIsUrlPanelOpen(false)}
                          size="sm"
                          tone="white"
                          variant="ghost"
                        >
                          취소
                        </Button>
                        <Button
                          disabled={isAddUrlsDisabled}
                          onClick={handleAddUrls}
                          size="sm"
                          tone="white"
                        >
                          추가
                        </Button>
                      </div>
                    </div>
                  </section>
                ) : null}
                <ImageEmbedPopoverEditor
                  duplicateRowIds={duplicateRowIds}
                  errorMessage={errorMessage}
                  filledRows={filledRows}
                  isMobileListCollapsed={isMobileListCollapsed}
                  isUploading={isUploading}
                  onFileChange={handleReplaceSelectedRowImage}
                  onMoveRow={handleMoveRow}
                  onRemoveRow={handleRemoveRow}
                  onSelectRow={setSelectedRowId}
                  onToggleMobileList={() => setIsMobileListCollapsed(current => !current)}
                  onUpdateRow={updateRow}
                  rows={rows}
                  selectedPreviewUrl={selectedPreviewUrl}
                  selectedRow={selectedRow}
                  selectedUrlInputRef={selectedUrlInputRef}
                  uploadAccept={ACCEPTED_IMAGE_FILE_TYPES}
                />
              </>
            )}
          </div>

          {!isEmptyState ? (
            <footer className={modalFooterClass}>
              <div className={modalFooterActionGroupClass}>
                <Button
                  disabled={filledRows.length === 0 || hasDuplicateUrls}
                  onClick={() => handleApply('individual')}
                  size="xs"
                >
                  개별 이미지로 삽입
                </Button>
                <Button
                  disabled={filledRows.length <= 1 || hasDuplicateUrls}
                  onClick={() => handleApply('gallery')}
                  size="xs"
                >
                  슬라이드로 삽입
                </Button>
              </div>
            </footer>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

const modalContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  width: '[min(72rem,calc(100dvw-2rem))]',
  maxWidth: 'full',
  maxHeight: '[calc(100dvh-2rem)]',
  p: '6',
  backgroundColor: 'surface',
  minHeight: '0',
  minWidth: '0',
  overflowX: 'hidden',
  overflowY: 'auto',
});

const modalScrollableContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  paddingBottom: '2',
});

const modalFooterClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
});

const modalFooterActionGroupClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

const modalHeaderClass = css({
  display: 'grid',
  gap: '1',
  paddingRight: '10',
});

const headerTopRowClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  flexWrap: 'wrap',
});

const modalTitleClass = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text',
});

const headerButtonGroupClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

const triggerButtonClass = css({
  minWidth: '9',
  minHeight: '9',
  width: '9',
  height: '9',
  px: '0',
  borderRadius: 'lg',
  borderColor: 'border',
});

const uploadButtonWrapClass = css({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[fit-content]',
  minHeight: '10',
  px: '3',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  backgroundColor: 'surface',
  color: 'text',
  cursor: 'pointer',
  flex: 'none',
  _focusWithin: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    borderColor: 'primary',
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

const urlPanelClass = css({
  display: 'grid',
  gap: '2',
  padding: '4',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  borderRadius: 'xl',
  backgroundColor: 'surfaceMuted',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text',
});

const urlPanelActionRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  flexWrap: 'wrap',
});

const metaTextClass = css({
  fontSize: 'xs',
  color: 'muted',
});
