'use client';

import Image from 'next/image';
import React from 'react';
import { css, cx } from 'styled-system/css';

import { normalizeEmbedInput } from '@/features/edit-markdown/model/embed-popover-state';
import type {
  FilledImageRow,
  ImageInputRow,
} from '@/features/edit-markdown/model/image-embed-popover-state';
import { viewportImageSizes } from '@/shared/config/responsive';
import { Button } from '@/shared/ui/button/button';
import { ArrowUpIcon, TrashIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';

type ImageEmbedPopoverEditorProps = {
  duplicateRowIds: Set<string>;
  errorMessage: string | null;
  filledRows: FilledImageRow[];
  isMobileListCollapsed: boolean;
  isUploading: boolean;
  rows: ImageInputRow[];
  selectedPreviewUrl: string | null;
  selectedRow: ImageInputRow | null;
  uploadAccept: string;
  onApply: (mode: 'gallery' | 'individual') => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMoveRow: (rowId: string, direction: 'down' | 'up') => void;
  onRemoveRow: (rowId: string) => void;
  onSelectRow: (rowId: string) => void;
  onToggleMobileList: () => void;
  onUpdateRow: (rowId: string, patch: Partial<Pick<ImageInputRow, 'alt' | 'url'>>) => void;
};

/**
 * 이미지가 하나 이상 있을 때 사용하는 편집 상태 UI입니다.
 *
 * @param props 편집 상태 렌더링과 입력 연결에 필요한 속성입니다.
 * @returns 목록/미리보기/상세 편집 UI를 반환합니다.
 */
export const ImageEmbedPopoverEditor = ({
  duplicateRowIds,
  errorMessage,
  filledRows,
  isMobileListCollapsed,
  isUploading,
  onApply,
  onFileChange,
  onMoveRow,
  onRemoveRow,
  onSelectRow,
  onToggleMobileList,
  onUpdateRow,
  rows,
  selectedPreviewUrl,
  selectedRow,
  uploadAccept,
}: ImageEmbedPopoverEditorProps) => {
  const hasDuplicateUrls = duplicateRowIds.size > 0;

  return (
    <div className={editorLayoutClass}>
      <footer className={actionRowClass}>
        <div className={footerActionGroupClass}>
          <Button
            disabled={filledRows.length === 0 || hasDuplicateUrls}
            onClick={() => onApply('individual')}
            size="xs"
          >
            개별 이미지로 삽입
          </Button>
          <Button
            disabled={filledRows.length <= 1 || hasDuplicateUrls}
            onClick={() => onApply('gallery')}
            size="xs"
          >
            슬라이드로 삽입
          </Button>
        </div>
      </footer>

      <div className={bodyClass}>
        <aside
          className={cx(sidebarClass, isMobileListCollapsed ? mobileSidebarHiddenClass : undefined)}
        >
          <div className={sidebarHeaderClass}>
            <div className={sidebarHeaderInfoClass}>
              <p className={fieldLabelClass}>이미지 목록</p>
              <p className={metaTextClass}>{filledRows.length}개 · 최대 10개</p>
            </div>
            <Button
              className={mobileListToggleButtonClass}
              onClick={onToggleMobileList}
              size="xs"
              tone="white"
              variant="ghost"
            >
              {isMobileListCollapsed ? '이미지 목록 열기' : '이미지 목록 닫기'}
            </Button>
          </div>
          <div className={rowListClass} data-image-list data-scrollable="true">
            {rows.map((row, index) => {
              const hasDuplicateUrl = duplicateRowIds.has(row.id);
              const isSelected = row.id === selectedRow?.id;

              return (
                <div
                  className={cx(
                    rowListItemClass,
                    isSelected ? rowListItemSelectedClass : undefined,
                    hasDuplicateUrl ? rowListItemErrorClass : undefined,
                  )}
                  key={row.id}
                >
                  <button
                    aria-pressed={isSelected}
                    className={rowListSelectButtonClass}
                    onClick={() => onSelectRow(row.id)}
                    type="button"
                  >
                    <span className={rowListItemIndexClass}>{index + 1}</span>
                    <span className={rowListItemTextClass}>
                      {normalizeEmbedInput(row.alt) ?? normalizeEmbedInput(row.url) ?? '새 이미지'}
                    </span>
                  </button>
                  <div className={rowListSortActionClass}>
                    <button
                      aria-label={`${index + 1}번째 이미지를 위로 이동`}
                      className={rowListActionButtonClass}
                      disabled={index === 0}
                      onClick={event => {
                        event.stopPropagation();
                        onMoveRow(row.id, 'up');
                      }}
                      type="button"
                    >
                      <ArrowUpIcon aria-hidden color="text" size="sm" />
                    </button>
                    <button
                      aria-label={`${index + 1}번째 이미지를 아래로 이동`}
                      className={cx(rowListActionButtonClass, rowSortButtonDownClass)}
                      disabled={index === rows.length - 1}
                      onClick={event => {
                        event.stopPropagation();
                        onMoveRow(row.id, 'down');
                      }}
                      type="button"
                    >
                      <ArrowUpIcon aria-hidden color="text" size="sm" />
                    </button>
                    <button
                      aria-label={`${index + 1}번째 이미지 삭제`}
                      className={rowListActionButtonClass}
                      onClick={event => {
                        event.stopPropagation();
                        onRemoveRow(row.id);
                      }}
                      type="button"
                    >
                      <TrashIcon aria-hidden color="text" size="sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className={previewFrameClass} data-image-preview-frame data-preview-shape="square">
          {selectedPreviewUrl ? (
            <Image
              alt={normalizeEmbedInput(selectedRow?.alt ?? '') ?? '이미지 미리보기'}
              className={previewImageClass}
              data-image-preview-fit="contain"
              fill
              sizes={viewportImageSizes.imageSourceField}
              src={selectedPreviewUrl}
              unoptimized
            />
          ) : (
            <div className={previewPlaceholderClass}>미리보기 없음</div>
          )}
        </div>

        <section className={editorFieldsClass}>
          <div className={rowFieldClass}>
            <label className={fieldLabelClass} htmlFor="markdown-toolbar-selected-image-url">
              URL
            </label>
            <Input
              disabled={!selectedRow}
              id="markdown-toolbar-selected-image-url"
              onChange={event =>
                selectedRow ? onUpdateRow(selectedRow.id, { url: event.target.value }) : undefined
              }
              placeholder="https://example.com/image.png"
              value={selectedRow?.url ?? ''}
            />
          </div>

          <div className={rowFieldClass}>
            <label className={fieldLabelClass} htmlFor="markdown-toolbar-selected-image-alt">
              대체 텍스트
            </label>
            <Input
              disabled={!selectedRow}
              id="markdown-toolbar-selected-image-alt"
              onChange={event =>
                selectedRow ? onUpdateRow(selectedRow.id, { alt: event.target.value }) : undefined
              }
              placeholder="이미지 설명"
              value={selectedRow?.alt ?? ''}
            />
          </div>

          <div className={rowFieldClass}>
            <span className={fieldLabelClass}>이미지 업로드</span>
            <label className={uploadButtonWrapClass}>
              <span aria-live="polite" className={uploadButtonLabelClass} role="status">
                {isUploading ? '업로드 중...' : '선택 이미지 교체'}
              </span>
              <input
                accept={uploadAccept}
                aria-label="선택 이미지 업로드"
                className={fileInputClass}
                disabled={isUploading || !selectedRow}
                onChange={onFileChange}
                type="file"
              />
            </label>
          </div>

          {selectedRow && duplicateRowIds.has(selectedRow.id) ? (
            <p className={metaErrorTextClass} role="alert">
              중복 URL은 삽입할 수 없습니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p className={metaErrorTextClass} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
};

const editorLayoutClass = css({
  display: 'grid',
  gap: '4',
  minHeight: '0',
});

const bodyClass = css({
  display: {
    base: 'flex',
    md: 'grid',
  },
  flexDirection: {
    base: 'column-reverse',
    md: 'row',
  },
  gridTemplateColumns: {
    md: '[18rem 16rem minmax(0,1fr)]',
  },
  columnGap: {
    md: '6',
  },
  rowGap: {
    base: '4',
  },
  flex: '1',
  minHeight: '0',
  overflow: 'hidden',
  paddingY: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
});

const sidebarClass = css({
  display: 'grid',
  gridTemplateRows: '[auto minmax(0,1fr)]',
  gap: '4',
  minHeight: '0',
  pr: {
    base: '0',
    md: '5',
  },
  borderRightWidth: {
    base: '0',
    md: '1px',
  },
  borderRightStyle: {
    base: 'none',
    md: 'solid',
  },
  borderRightColor: {
    base: 'transparent',
    md: 'border',
  },
  overflow: 'hidden',
});

const mobileSidebarHiddenClass = css({
  display: {
    base: 'none',
    md: 'grid',
  },
});

const sidebarHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const sidebarHeaderInfoClass = css({
  display: 'grid',
  gap: '1',
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

const rowListClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'start',
  gap: '2',
  minHeight: '0',
  maxHeight: {
    base: '56',
    md: '80',
  },
  overflowY: 'auto',
  pr: '1',
});

const rowListItemClass = css({
  position: 'relative',
  width: 'full',
  borderRadius: 'lg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  backgroundColor: 'surface',
  textAlign: 'left',
});

const rowListSelectButtonClass = css({
  display: 'grid',
  gridTemplateColumns: '[1.5rem minmax(0,1fr)]',
  gap: '2',
  alignItems: 'center',
  minWidth: '0',
  padding: '3',
  paddingRight: '24',
  width: 'full',
  height: 'full',
  textAlign: 'left',
});

const rowListItemSelectedClass = css({
  borderColor: 'primary',
  backgroundColor: 'surfaceMuted',
});

const rowListItemErrorClass = css({
  borderColor: 'error',
});

const rowListItemIndexClass = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'muted',
});

const rowListItemTextClass = css({
  minWidth: '0',
  fontSize: 'sm',
  color: 'text',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const rowListSortActionClass = css({
  position: 'absolute',
  top: '2',
  right: '2',
  display: 'flex',
  alignItems: 'center',
  gap: '1',
});

const rowListActionButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '7',
  height: '7',
  borderRadius: 'md',
  borderWidth: '0',
  backgroundColor: 'transparent',
  color: 'text',
  _hover: {
    backgroundColor: 'surfaceMuted',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    opacity: '0.4',
  },
});

const rowSortButtonDownClass = css({
  '& svg': {
    transform: 'rotate(180deg)',
  },
});

const previewFrameClass = css({
  position: 'relative',
  alignSelf: 'start',
  width: 'full',
  maxWidth: {
    base: '40',
    md: '64',
  },
  aspectRatio: 'square',
  justifySelf: 'center',
  order: {
    base: '0',
    md: '0',
  },
  overflow: 'hidden',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surfaceMuted',
});

const previewImageClass = css({
  objectFit: 'contain',
  objectPosition: 'center',
  padding: '4',
});

const previewPlaceholderClass = css({
  display: 'grid',
  placeItems: 'center',
  width: 'full',
  height: 'full',
  fontSize: 'sm',
  color: 'muted',
});

const editorFieldsClass = css({
  display: 'grid',
  alignContent: 'start',
  gap: '4',
  minHeight: '0',
  paddingY: '1',
  overflowY: 'auto',
  order: {
    base: '1',
    md: '0',
  },
});

const rowFieldClass = css({
  display: 'grid',
  gap: '2',
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

const metaErrorTextClass = css({
  fontSize: 'xs',
  color: 'error',
});

const actionRowClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  order: '1',
  paddingTop: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
});

const footerActionGroupClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

const mobileListToggleButtonClass = css({
  display: {
    base: 'inline-flex',
    md: 'none',
  },
});
