'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css, cva } from 'styled-system/css';

import type {
  ResumeEditorContentMap,
  ResumePublishValidationErrors,
} from '@/entities/resume/model/resume-editor.types';
import {
  isResumeEditorContentMapEqual,
  validateResumePublishState,
} from '@/entities/resume/model/resume-editor.utils';
import {
  parseResumeEditorError,
  resolveResumePublishInlineErrorField,
} from '@/entities/resume/model/resume-editor-error';
import { MarkdownToolbar } from '@/features/edit-markdown/ui/markdown-toolbar';
import { LOCALE_CODE_LABELS } from '@/shared/lib/i18n/locale-code-labels';
import { getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { EDITOR_LOCALES, type Locale } from '@/widgets/editor/ui/core/editor-core.types';
import { formatSavedAtLabel } from '@/widgets/editor/ui/core/editor-core.utils';
import type { ResumeEditorCoreProps } from '@/widgets/resume-editor/ui/resume-editor.types';

type ResumeEditorFieldKey = 'body' | 'description' | 'download_button_label' | 'title';

type SaveStatus = 'dirty' | 'idle' | 'saving';

type ResumeLocaleFieldsProps = {
  activeContent: ResumeEditorContentMap[Locale];
  activeLocale: Locale;
  bodyTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  markdownOptions: ReturnType<typeof getMarkdownOptions>;
  onFieldChange: (key: ResumeEditorFieldKey, value: string) => void;
};

/**
 * 현재 locale의 resume 입력 필드를 렌더링합니다.
 */
const ResumeLocaleFieldsBase = ({
  activeContent,
  activeLocale,
  bodyTextareaRef,
  markdownOptions,
  onFieldChange,
}: ResumeLocaleFieldsProps) => (
  <section className={formGridClass}>
    <label className={fieldClass}>
      <span className={labelClass}>제목</span>
      <Input
        aria-label="제목"
        onChange={event => onFieldChange('title', event.target.value)}
        value={activeContent.title}
      />
    </label>
    <label className={fieldClass}>
      <span className={labelClass}>설명</span>
      <Input
        aria-label="설명"
        onChange={event => onFieldChange('description', event.target.value)}
        value={activeContent.description}
      />
    </label>
    <label className={fieldClass}>
      <span className={labelClass}>다운로드 버튼 라벨</span>
      <Input
        aria-label="다운로드 버튼 라벨"
        onChange={event => onFieldChange('download_button_label', event.target.value)}
        value={activeContent.download_button_label}
      />
    </label>
    <div className={bodyFieldClass}>
      <section aria-label="본문 편집" className={editorPaneClass}>
        <div className={editorPaneHeaderClass}>
          <p className={editorPaneTitleClass}>본문</p>
          <p className={editorPaneDescriptionClass}>Markdown 문법으로 작성할 수 있다.</p>
        </div>
        <div className={editorToolbarWrapClass}>
          <MarkdownToolbar
            contentType="article"
            onChange={nextValue => onFieldChange('body', nextValue)}
            textareaRef={bodyTextareaRef}
          />
        </div>
        <div className={editorTextareaWrapClass}>
          <Textarea
            aria-label="본문"
            autoResize={false}
            className={editorTextareaClass}
            onChange={event => onFieldChange('body', event.target.value)}
            placeholder="마크다운 본문을 입력하세요"
            ref={bodyTextareaRef}
            rows={18}
            value={activeContent.body}
          />
        </div>
      </section>

      <section aria-label={`${activeLocale} 본문 미리보기`} className={previewPaneClass}>
        <div className={editorPaneHeaderClass}>
          <p className={editorPaneTitleClass}>Preview</p>
          <p className={editorPaneDescriptionClass}>
            현재 locale 본문을 markdown 결과로 미리 본다.
          </p>
        </div>
        {activeContent.body.trim().length > 0 ? (
          <div className={markdownBodyClass}>
            {renderRichMarkdown({
              markdown: activeContent.body,
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

ResumeLocaleFieldsBase.displayName = 'ResumeLocaleFields';

const ResumeLocaleFields = React.memo(ResumeLocaleFieldsBase);

/**
 * resume 전용 편집 셸에서 locale별 소개 텍스트와 저장 상태를 관리합니다.
 */
export const ResumeEditorCore = ({
  hideAppFrameFooter = false,
  initialContents,
  initialSavedAt = null,
  onDraftSave,
  onPublish,
}: ResumeEditorCoreProps) => {
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [contents, setContents] = useState(initialContents);
  const [savedSnapshot, setSavedSnapshot] = useState(initialContents);
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishErrors, setPublishErrors] = useState<ResumePublishValidationErrors>({});
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const bodyTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const dirty = useMemo(
    () => !isResumeEditorContentMapEqual(contents, savedSnapshot),
    [contents, savedSnapshot],
  );
  const markdownOptions = useMemo(() => getMarkdownOptions(), []);
  const activeContent = contents[activeLocale];
  const savedAtLabel = formatSavedAtLabel(savedAt);
  /**
   * 현재 locale 필드 값을 부분 갱신합니다.
   */
  const updateActiveContent = useCallback(
    (key: ResumeEditorFieldKey, value: string) => {
      setContents(previous => {
        if (previous[activeLocale][key] === value) return previous;

        return {
          ...previous,
          [activeLocale]: {
            ...previous[activeLocale],
            [key]: value,
          },
        };
      });

      if (activeLocale === 'ko' && key === 'title') {
        setPublishErrors(previous => ({
          ...previous,
          koTitle: undefined,
        }));
      }

      if (activeLocale === 'ko' && key === 'body') {
        setPublishErrors(previous => ({
          ...previous,
          koBody: undefined,
        }));
      }
    },
    [activeLocale],
  );

  /**
   * 저장 실패 토스트를 추가합니다.
   */
  const pushToast = useCallback((message: string) => {
    setToastItems(previous => [
      ...previous,
      {
        id: `resume-editor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone: 'error',
      },
    ]);
  }, []);
  const closeToast = useCallback((id: string) => {
    setToastItems(previous => previous.filter(item => item.id !== id));
  }, []);

  /**
   * draft 저장 callback을 실행하고 저장 시각 snapshot을 갱신합니다.
   */
  const runDraftSave = useCallback(async () => {
    if (!onDraftSave) {
      return;
    }

    if (!dirty) {
      return;
    }

    setSaveStatus('saving');

    try {
      const result = await onDraftSave({
        contents,
        dirty,
      });

      setSavedSnapshot(contents);
      setSavedAt(result?.savedAt ?? new Date().toISOString());
      setSaveStatus('idle');
    } catch (error) {
      setSaveStatus('dirty');
      pushToast(parseResumeEditorError(error, 'draftSaveFailed').message);
    }
  }, [contents, dirty, onDraftSave, pushToast]);
  const handleDraftSave = useCallback(() => {
    void runDraftSave();
  }, [runDraftSave]);
  const handlePublish = useCallback(async () => {
    const nextState = {
      contents,
      dirty,
    };
    const contentValidationErrors = validateResumePublishState({ contents });

    setPublishErrors(contentValidationErrors);

    if (Object.keys(contentValidationErrors).length > 0 || !onPublish) {
      return;
    }

    setIsPublishing(true);

    try {
      await onPublish(nextState);
    } catch (error) {
      const parsedError = parseResumeEditorError(error, 'publishFailed');
      const inlineField = resolveResumePublishInlineErrorField(parsedError.code);

      if (inlineField) {
        setPublishErrors(previous => ({
          ...previous,
          [inlineField]: parsedError.message,
        }));
        return;
      }

      pushToast(parsedError.message);
    } finally {
      setIsPublishing(false);
    }
  }, [contents, dirty, onPublish, pushToast]);
  const handlePublishClick = useCallback(() => {
    void handlePublish();
  }, [handlePublish]);
  const handleLocaleChange = useCallback((locale: Locale) => {
    setActiveLocale(locale);
  }, []);

  useEffect(() => {
    setSaveStatus(dirty ? 'dirty' : 'idle');
  }, [dirty]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty]);

  return (
    <main
      className={pageClass}
      data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
    >
      <section className={panelClass}>
        <header className={headerClass}>
          <div className={headerCopyClass}>
            <h1 className={titleClass}>이력서 편집</h1>
            <p className={descriptionClass}>
              locale별 이력서 소개 문구와 다운로드 라벨을 관리합니다.
            </p>
          </div>
          <div className={actionRowClass}>
            <p aria-live="polite" className={saveStatusClass}>
              {saveStatus === 'saving'
                ? '저장 중...'
                : dirty
                  ? '변경사항 있음'
                  : savedAtLabel
                    ? `저장됨 ${savedAtLabel}`
                    : ''}
            </p>
            {onDraftSave ? (
              <Button disabled={saveStatus === 'saving'} onClick={handleDraftSave} size="sm">
                임시저장
              </Button>
            ) : null}
          </div>
        </header>

        <div aria-label="이력서 언어 선택" className={tabListClass} role="tablist">
          {EDITOR_LOCALES.map(locale => (
            <button
              aria-selected={locale === activeLocale}
              className={tabRecipe({ active: locale === activeLocale })}
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              role="tab"
              type="button"
            >
              {LOCALE_CODE_LABELS[locale]}
            </button>
          ))}
        </div>

        <ResumeLocaleFields
          activeContent={activeContent}
          activeLocale={activeLocale}
          bodyTextareaRef={bodyTextareaRef}
          markdownOptions={markdownOptions}
          onFieldChange={updateActiveContent}
        />

        <footer className={publishFooterClass}>
          {publishErrors.koTitle ? (
            <p aria-live="assertive" className={publishErrorClass} role="alert">
              {publishErrors.koTitle}
            </p>
          ) : null}
          {publishErrors.koBody ? (
            <p aria-live="assertive" className={publishErrorClass} role="alert">
              {publishErrors.koBody}
            </p>
          ) : null}
          <div className={publishButtonRowClass}>
            <Button
              disabled={isPublishing || saveStatus === 'saving'}
              onClick={handlePublishClick}
              size="sm"
              tone="primary"
            >
              {isPublishing ? '발행 중...' : '발행하기'}
            </Button>
          </div>
        </footer>
      </section>

      <ToastViewport items={toastItems} onClose={closeToast} />
    </main>
  );
};

const pageClass = css({
  width: 'full',
  px: '4',
  py: '8',
});

const panelClass = css({
  width: 'full',
  maxWidth: '[72rem]',
  mx: 'auto',
  display: 'grid',
  gap: '6',
});

const headerClass = css({
  display: 'grid',
  gap: '4',
  '@media (min-width: 760px)': {
    gridTemplateColumns: '[minmax(0,1fr)_auto]',
    alignItems: 'end',
  },
});

const headerCopyClass = css({
  display: 'grid',
  gap: '2',
});

const titleClass = css({
  m: '0',
  fontSize: '3xl',
  lineHeight: 'tight',
});

const descriptionClass = css({
  m: '0',
  color: 'muted',
});

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '3',
});

const saveStatusClass = css({
  minWidth: '[7rem]',
  m: '0',
  textAlign: 'right',
  fontSize: 'sm',
  color: 'muted',
});

const tabListClass = css({
  display: 'flex',
  gap: '4',
  borderBottom: '[1px solid var(--colors-border)]',
});

const tabRecipe = cva({
  base: {
    appearance: 'none',
    border: 'none',
    borderBottom: '[2px solid transparent]',
    bg: 'transparent',
    px: '2',
    py: '2',
    color: 'muted',
    fontWeight: 'semibold',
    cursor: 'pointer',
  },
  variants: {
    active: {
      false: {},
      true: {
        borderBottomColor: 'primary',
        color: 'primary',
      },
    },
  },
});

const formGridClass = css({
  display: 'grid',
  gap: '4',
  '@media (min-width: 760px)': {
    gridTemplateColumns: '[repeat(2,minmax(0,1fr))]',
  },
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const bodyFieldClass = css({
  display: 'grid',
  gap: '4',
  '@media (min-width: 760px)': {
    gridColumn: '[1 / -1]',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const editorPaneClass = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  minHeight: '[36rem]',
  maxHeight: '[min(70vh,44rem)]',
  overflow: 'hidden',
  p: '4',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surface',
  '@media (max-width: 759px)': {
    minHeight: '[28rem]',
    maxHeight: '[60vh]',
  },
});

const previewPaneClass = css({
  display: 'grid',
  alignContent: 'start',
  gap: '4',
  minWidth: '0',
  minHeight: '[36rem]',
  maxHeight: '[min(70vh,44rem)]',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  p: '4',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surface',
  '@media (max-width: 759px)': {
    minHeight: '[20rem]',
  },
});

const editorPaneHeaderClass = css({
  display: 'grid',
  gap: '1',
});

const editorPaneTitleClass = css({
  m: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const editorPaneDescriptionClass = css({
  m: '0',
  fontSize: 'sm',
  color: 'muted',
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

const editorTextareaClass = css({
  flex: '1',
  minHeight: '0',
  resize: 'none',
});

const emptyPreviewClass = css({
  m: '0',
  color: 'muted',
  fontSize: 'sm',
});

const publishFooterClass = css({
  display: 'grid',
  gap: '3',
  pt: '2',
  borderTop: '[1px solid var(--colors-border)]',
});

const publishErrorClass = css({
  m: '0',
  fontSize: 'sm',
  color: 'error',
});

const publishButtonRowClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
});
