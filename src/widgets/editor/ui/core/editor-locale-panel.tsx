'use client';

import React from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css } from 'styled-system/css';

import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { MarkdownToolbar } from '@/features/edit-markdown/ui/markdown-toolbar';
import { LOCALE_CODE_LABELS } from '@/shared/lib/i18n/locale-code-labels';
import { type getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';
import { Input } from '@/shared/ui/input/input';
import { Textarea } from '@/shared/ui/textarea/textarea';
import type {
  EditorState,
  Locale,
  MobileEditorPane,
} from '@/widgets/editor/ui/core/editor-core.types';
import { resizeTextareaToContent } from '@/widgets/editor/ui/core/editor-core-textarea';

type EditorLocalePanelProps = {
  activeLocaleHasTitleError: boolean;
  contentType: EditorContentType;
  extraLocaleFieldLabel?: string;
  isActive: boolean;
  isMobileLayout: boolean;
  locale: Locale;
  mobileEditorPane: MobileEditorPane;
  markdownOptions: ReturnType<typeof getMarkdownOptions>;
  onContentChange: (locale: Locale, value: string) => void;
  onDescriptionChange: (locale: Locale, value: string) => void;
  onExtraLocaleFieldChange?: (locale: Locale, value: string) => void;
  onTextareaKeyDown: (locale: Locale, event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onTextareaPaste: (
    locale: Locale,
    currentValue: string,
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => void;
  onTextareaScroll: (locale: Locale, scrollTop: number) => void;
  onTitleChange: (locale: Locale, value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  translation: EditorState['translations'][Locale];
};

/**
 * locale별 제목/설명/본문 편집 패널과 미리보기 패널을 렌더링합니다.
 * memo 처리로 현재 수정 중인 locale이 아닌 패널은 가능한 한 재렌더를 피합니다.
 */
const EditorLocalePanelBase = ({
  activeLocaleHasTitleError,
  contentType,
  extraLocaleFieldLabel,
  isActive,
  isMobileLayout,
  locale,
  mobileEditorPane,
  markdownOptions,
  onContentChange,
  onDescriptionChange,
  onExtraLocaleFieldChange,
  onTextareaKeyDown,
  onTextareaPaste,
  onTextareaScroll,
  onTitleChange,
  textareaRef,
  translation,
}: EditorLocalePanelProps) => {
  const localeLabel = LOCALE_CODE_LABELS[locale];
  const titleTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const descriptionTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const editorGridRef = React.useRef<HTMLDivElement | null>(null);
  const [paneHeight, setPaneHeight] = React.useState<string | undefined>(undefined);
  const shouldRenderPreview = isActive && (!isMobileLayout || mobileEditorPane === 'preview');
  const measurePaneHeight = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const node = editorGridRef.current;
    if (!node) return;

    const nextHeight = Math.max(0, window.innerHeight - node.getBoundingClientRect().top - 24);
    setPaneHeight(`${nextHeight}px`);
  }, []);

  React.useEffect(() => {
    if (!isActive) return;

    resizeTextareaToContent(titleTextareaRef.current);
    resizeTextareaToContent(descriptionTextareaRef.current);
  }, [isActive, translation.description, translation.title]);

  React.useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    const node = editorGridRef.current;
    if (!node) return;
    measurePaneHeight();

    window.addEventListener('resize', measurePaneHeight);
    window.addEventListener('scroll', measurePaneHeight, { passive: true });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', measurePaneHeight);
        window.removeEventListener('scroll', measurePaneHeight);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      measurePaneHeight();
    });

    resizeObserver.observe(node);

    if (node.parentElement) {
      resizeObserver.observe(node.parentElement);
    }

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measurePaneHeight);
      window.removeEventListener('scroll', measurePaneHeight);
    };
  }, [extraLocaleFieldLabel, isActive, isMobileLayout, measurePaneHeight, mobileEditorPane]);

  React.useEffect(() => {
    if (!isActive) return;

    measurePaneHeight();
  }, [isActive, measurePaneHeight, translation.description, translation.title]);

  return (
    <section
      aria-labelledby={`editor-tab-${locale}`}
      className={localePanelClass}
      hidden={!isActive}
      id={`editor-panel-${locale}`}
      role="tabpanel"
    >
      <div className={summaryGridClass}>
        <div className={summaryFieldClass}>
          <label className={fieldLabelClass} htmlFor={`editor-title-${locale}`}>
            제목
          </label>
          <Textarea
            aria-describedby={
              activeLocaleHasTitleError ? `editor-title-error-${locale}` : undefined
            }
            aria-invalid={activeLocaleHasTitleError ? true : undefined}
            className={textareaInfoClass}
            id={`editor-title-${locale}`}
            onChange={event => onTitleChange(locale, event.target.value)}
            placeholder={`${localeLabel} 제목`}
            ref={titleTextareaRef}
            value={translation.title}
          />
          {activeLocaleHasTitleError ? (
            <p className={titleErrorClass} id={`editor-title-error-${locale}`} role="alert">
              제목을 입력해주세요
            </p>
          ) : null}
        </div>

        <div className={summaryFieldClass}>
          <label className={fieldLabelClass} htmlFor={`editor-description-${locale}`}>
            설명
          </label>
          <Textarea
            className={textareaInfoClass}
            id={`editor-description-${locale}`}
            onChange={event => onDescriptionChange(locale, event.target.value)}
            placeholder={`${localeLabel} 설명`}
            ref={descriptionTextareaRef}
            value={translation.description}
          />
        </div>
        {extraLocaleFieldLabel && onExtraLocaleFieldChange ? (
          <div className={summaryFieldClass}>
            <label className={fieldLabelClass} htmlFor={`editor-extra-${locale}`}>
              {extraLocaleFieldLabel}
            </label>
            <Input
              aria-label={extraLocaleFieldLabel}
              id={`editor-extra-${locale}`}
              onChange={event => onExtraLocaleFieldChange(locale, event.target.value)}
              placeholder={`${localeLabel} ${extraLocaleFieldLabel}`}
              value={translation.download_button_label ?? ''}
            />
          </div>
        ) : null}
      </div>

      <div
        className={editorGridClass}
        ref={editorGridRef}
        style={paneHeight ? { height: paneHeight } : undefined}
      >
        <section
          aria-label="본문 편집"
          className={editorPaneClass}
          hidden={isMobileLayout && mobileEditorPane !== 'edit'}
          id={isMobileLayout ? `editor-pane-edit-${locale}` : undefined}
        >
          <div className={editorToolbarWrapClass}>
            <MarkdownToolbar
              contentType={contentType}
              onChange={nextValue => onContentChange(locale, nextValue)}
              textareaRef={textareaRef}
            />
          </div>
          <div className={editorTextareaWrapClass}>
            <Textarea
              aria-label="본문 입력"
              autoResize={false}
              className={editorTextareaClass}
              onChange={event => onContentChange(locale, event.target.value)}
              onKeyDown={event => onTextareaKeyDown(locale, event)}
              onPaste={event => onTextareaPaste(locale, translation.content, event)}
              onScroll={event => onTextareaScroll(locale, event.currentTarget.scrollTop)}
              placeholder="마크다운 본문을 입력하세요"
              ref={textareaRef}
              rows={18}
              value={translation.content}
            />
          </div>
        </section>

        <section
          aria-label="본문 미리보기"
          className={previewPaneClass}
          hidden={isMobileLayout && mobileEditorPane !== 'preview'}
          id={isMobileLayout ? `editor-pane-preview-${locale}` : undefined}
        >
          {shouldRenderPreview && translation.content.trim().length > 0 ? (
            <div className={markdownBodyClass}>
              {renderRichMarkdown({
                markdown: translation.content,
                renderMarkdownFragment: (fragmentMarkdown, key) => (
                  <MarkdownHooks key={key} {...markdownOptions}>
                    {fragmentMarkdown}
                  </MarkdownHooks>
                ),
              })}
            </div>
          ) : (
            <p className={emptyPreviewClass}>미리보기 내용이 없습니다.</p>
          )}
        </section>
      </div>
    </section>
  );
};

EditorLocalePanelBase.displayName = 'EditorLocalePanel';

export const EditorLocalePanel = React.memo(EditorLocalePanelBase);

const textareaInfoClass = css({
  minHeight: '[2.7rem]',
});

const localePanelClass = css({
  display: 'grid',
  gap: '4',
  minWidth: '0',
});

const summaryGridClass = css({
  display: 'grid',
  gap: '4',
  alignItems: 'stretch',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  _tabletDown: {
    gridTemplateColumns: '1fr',
  },
});

const summaryFieldClass = css({
  display: 'grid',
  gap: '2',
  alignContent: 'start',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const titleErrorClass = css({
  fontSize: 'sm',
  color: 'error',
});

const editorGridClass = css({
  display: 'grid',
  gap: '4',
  minWidth: '0',
  minHeight: '0',
  alignItems: 'stretch',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  _tabletDown: {
    gridTemplateColumns: '1fr',
  },
});

const editorPaneClass = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  minHeight: '0',
  height: 'full',
  overflow: 'hidden',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
});

const editorToolbarWrapClass = css({
  flex: 'none',
  minWidth: '0',
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: '[thin]',
});

const editorTextareaWrapClass = css({
  display: 'flex',
  flex: '1',
  minHeight: '0',
  minWidth: '0',
  overflow: 'hidden',
});

const previewPaneClass = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  minHeight: '0',
  height: 'full',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
});

const editorTextareaClass = css({
  width: 'full',
  minWidth: '0',
  minHeight: '0',
  height: 'full',
  maxHeight: 'full',
  flex: '1',
  resize: 'none',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  fontFamily: 'mono',
});

const emptyPreviewClass = css({
  fontSize: 'sm',
  color: 'muted',
});
