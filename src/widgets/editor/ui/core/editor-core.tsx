'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css, cva } from 'styled-system/css';

import { buildEditorLinkInsertion } from '@/entities/editor/model/markdown-link';
import {
  applyTextareaTransform,
  continueMarkdownList,
  indentMarkdownList,
  insertTemplate,
  outdentMarkdownList,
} from '@/entities/editor/model/selection-utils';
import { LOCALE_CODE_LABELS } from '@/shared/lib/i18n/locale-code-labels';
import { getMarkdownOptions } from '@/shared/lib/markdown/markdown-config';
import { Button } from '@/shared/ui/button/button';
import { ChevronRightIcon, EditIcon, EyeIcon } from '@/shared/ui/icons/app-icons';
import { TagSelector } from '@/shared/ui/tag-selector/tag-selector';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import {
  EDITOR_LOCALES,
  type EditorCoreProps,
  type EditorState,
  type Locale,
  type MobileEditorPane,
} from '@/widgets/editor/ui/core/editor-core.types';
import {
  createEmptyTranslations,
  formatSavedAtLabel,
  isEditorStateEqual,
  validateEditorState,
} from '@/widgets/editor/ui/core/editor-core.utils';
import {
  buildEditorStateSnapshot,
  getEditorSaveStatusLabel,
} from '@/widgets/editor/ui/core/editor-core-state';
import { EditorLocalePanel } from '@/widgets/editor/ui/core/editor-locale-panel';
import { useEditorLocaleState } from '@/widgets/editor/ui/core/use-editor-locale-state';
import { useEditorSubmitActions } from '@/widgets/editor/ui/core/use-editor-submit-actions';
import { useIsMobileEditorLayout } from '@/widgets/editor/ui/core/use-mobile-editor-layout';

/**
 * locale별 textarea 편집 상호작용을 구성합니다.
 */
export const EditorCore = ({
  availableTags,
  contentType,
  enableAutosave = true,
  extraLocaleFieldLabel,
  initialSavedAt = null,
  initialSlug = '',
  initialTags,
  initialTranslations,
  hideAppFrameFooter = false,
  hideTagSelector = false,
  onDirectPublish,
  onDraftSave,
  onDirectPublishError,
  onOpenPublishPanel,
  publishButtonLabel = '발행하기',
  publishPendingLabel = '발행 중...',
}: EditorCoreProps) => {
  const initialSnapshot = useMemo(
    () =>
      buildEditorStateSnapshot({
        dirty: false,
        slug: initialSlug,
        tags: initialTags,
        translations: {
          ...createEmptyTranslations(),
          ...initialTranslations,
        },
      }),
    [initialSlug, initialTags, initialTranslations],
  );
  const [mobileEditorPane, setMobileEditorPane] = useState<MobileEditorPane>('edit');
  const [slug] = useState(initialSlug);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const {
    activeLocale,
    handleLocaleChange,
    handleTextareaScroll,
    textareaRefs,
    translations,
    updateTranslationField,
  } = useEditorLocaleState({
    initialTranslations: initialSnapshot.translations,
  });
  const [savedState, setSavedState] = useState<EditorState>(initialSnapshot);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const isMobileLayout = useIsMobileEditorLayout();
  const markdownOptions = useMemo(() => getMarkdownOptions(), []);

  const currentState = useMemo(
    () =>
      buildEditorStateSnapshot({
        dirty: false,
        slug,
        tags: selectedTags,
        translations,
      }),
    [selectedTags, slug, translations],
  );
  const dirty = useMemo(
    () => !isEditorStateEqual(currentState, savedState),
    [currentState, savedState],
  );
  const validationResult = useMemo(() => validateEditorState(translations), [translations]);
  const activeLocaleHasTitleError =
    validationResult.localeValidation[activeLocale].hasContentWithoutTitle;

  /**
   * dirty 상태에서만 페이지 이탈 경고를 연결합니다.
   */
  useEffect(() => {
    if (!dirty || typeof window === 'undefined') return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty]);

  /**
   * 데스크톱으로 돌아오면 모바일 pane 상태를 기본값으로 정리합니다.
   */
  useEffect(() => {
    if (!isMobileLayout) {
      setMobileEditorPane('edit');
    }
  }, [isMobileLayout]);

  /**
   * autosave 기준을 만족하면 마지막 입력 후 180초 뒤 draft save를 실행합니다.
   */
  const pushToast = useCallback((item: ToastItem) => {
    setToastItems(previous => [...previous, item]);
  }, []);
  const closeToast = useCallback((id: string) => {
    setToastItems(previous => previous.filter(item => item.id !== id));
  }, []);
  const { handleManualSave, handlePublishAction, isPublishingDirectly, isSaving, lastSavedAt } =
    useEditorSubmitActions({
      currentState: {
        dirty,
        slug,
        tags: selectedTags,
        translations,
      },
      enableAutosave,
      initialSavedAt,
      onDirectPublish,
      onDirectPublishError,
      onDraftSave,
      onOpenPublishPanel,
      onSavedStateChange: setSavedState,
      pushToast,
      validationCanSave: validationResult.canSave,
    });
  const saveStatusLabel = useMemo(
    () =>
      getEditorSaveStatusLabel({
        dirty,
        formatSavedAtLabel,
        isSaving,
        lastSavedAt,
      }),
    [dirty, isSaving, lastSavedAt],
  );

  /**
   * 제목 입력을 locale별로 갱신합니다.
   */
  const handleTitleChange = useCallback(
    (locale: Locale, value: string) => {
      updateTranslationField(locale, 'title', value);
    },
    [updateTranslationField],
  );

  /**
   * 설명 입력을 locale별로 갱신합니다.
   */
  const handleDescriptionChange = useCallback(
    (locale: Locale, value: string) => {
      updateTranslationField(locale, 'description', value);
    },
    [updateTranslationField],
  );

  /**
   * 본문 입력을 locale별로 갱신합니다.
   */
  const handleContentChange = useCallback(
    (locale: Locale, value: string) => {
      updateTranslationField(locale, 'content', value);
    },
    [updateTranslationField],
  );

  /**
   * URL 붙여넣기와 텍스트+URL 붙여넣기를 markdown 링크 문법으로 변환합니다.
   */
  const handleTextareaPaste = useCallback(
    (locale: Locale, currentValue: string, event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const selectedText = currentValue.slice(
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
      );
      const insertion = buildEditorLinkInsertion({
        clipboardText: event.clipboardData.getData('text'),
        selectedText,
      });

      if (!insertion) return;

      event.preventDefault();
      applyTextareaTransform(
        event.currentTarget,
        nextValue => handleContentChange(locale, nextValue),
        textarea => insertTemplate(textarea, insertion.text, insertion.text.length),
      );
    },
    [handleContentChange],
  );

  /**
   * markdown 목록 계열의 Enter/Tab 편집 보조 규칙을 유지합니다.
   */
  const handleTextareaKeyDown = useCallback(
    (locale: Locale, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        const nextValue = continueMarkdownList(event.currentTarget);

        if (!nextValue) return;

        event.preventDefault();
        applyTextareaTransform(
          event.currentTarget,
          nextValueText => handleContentChange(locale, nextValueText),
          () => nextValue,
        );
        return;
      }

      if (event.key !== 'Tab') return;

      const nextValue = event.shiftKey
        ? outdentMarkdownList(event.currentTarget)
        : indentMarkdownList(event.currentTarget);

      if (!nextValue) return;

      event.preventDefault();
      applyTextareaTransform(
        event.currentTarget,
        nextValueText => handleContentChange(locale, nextValueText),
        () => nextValue,
      );
    },
    [handleContentChange],
  );
  return (
    <section
      className={rootClass}
      data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
    >
      <div className={metaStackClass}>
        <div className={actionRowClass}>
          <p aria-live="polite" className={saveStatusClass} role="status">
            {saveStatusLabel}
          </p>
          <div className={buttonGroupClass}>
            {onDraftSave ? (
              <Button disabled={isSaving} onClick={handleManualSave} size="sm" tone="white">
                임시저장
              </Button>
            ) : null}
            {onDirectPublish || onOpenPublishPanel ? (
              <Button
                disabled={isPublishingDirectly}
                onClick={() => {
                  void handlePublishAction();
                }}
                size="sm"
                tone="primary"
                trailingVisual={<ChevronRightIcon aria-hidden color="current" size="md" />}
              >
                {isPublishingDirectly ? publishPendingLabel : publishButtonLabel}
              </Button>
            ) : null}
          </div>
        </div>
        {!hideTagSelector ? (
          <TagSelector
            availableTags={availableTags}
            className={tagSelectorClass}
            emptyText={contentType === 'project' ? '사용 가능한 기술 스택이 없습니다.' : undefined}
            onChange={setSelectedTags}
            poolLabel={contentType === 'project' ? '기술 스택 선택기' : undefined}
            poolTitle={contentType === 'project' ? 'Tech Stack' : undefined}
            selectLabel={contentType === 'project' ? '기술 스택' : undefined}
            selectedTagSlugs={selectedTags}
          />
        ) : null}
      </div>

      <div aria-label="언어 선택" className={localeTabListClass} role="tablist">
        {EDITOR_LOCALES.map(locale => (
          <button
            aria-controls={`editor-panel-${locale}`}
            aria-selected={activeLocale === locale}
            className={localeTabRecipe({ active: activeLocale === locale })}
            id={`editor-tab-${locale}`}
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            role="tab"
            type="button"
          >
            {LOCALE_CODE_LABELS[locale]}
          </button>
        ))}
      </div>

      {isMobileLayout ? (
        <div aria-label="편집 패널 선택" className={mobilePaneTabListClass} role="tablist">
          <button
            aria-controls={`editor-pane-edit-${activeLocale}`}
            aria-selected={mobileEditorPane === 'edit'}
            className={mobilePaneTabRecipe({ active: mobileEditorPane === 'edit' })}
            onClick={() => setMobileEditorPane('edit')}
            role="tab"
            type="button"
          >
            <span aria-hidden className={tabIconClass}>
              <EditIcon color="current" size="sm" />
            </span>
            편집
          </button>
          <button
            aria-controls={`editor-pane-preview-${activeLocale}`}
            aria-selected={mobileEditorPane === 'preview'}
            className={mobilePaneTabRecipe({ active: mobileEditorPane === 'preview' })}
            onClick={() => setMobileEditorPane('preview')}
            role="tab"
            type="button"
          >
            <span aria-hidden className={tabIconClass}>
              <EyeIcon color="current" size="sm" />
            </span>
            미리보기
          </button>
        </div>
      ) : null}

      {EDITOR_LOCALES.map(locale => {
        const isActive = locale === activeLocale;

        return (
          <EditorLocalePanel
            activeLocaleHasTitleError={isActive && activeLocaleHasTitleError}
            contentType={contentType}
            extraLocaleFieldLabel={extraLocaleFieldLabel}
            isActive={isActive}
            isMobileLayout={isMobileLayout}
            key={locale}
            locale={locale}
            markdownOptions={markdownOptions}
            mobileEditorPane={mobileEditorPane}
            onContentChange={handleContentChange}
            onDescriptionChange={handleDescriptionChange}
            onExtraLocaleFieldChange={
              extraLocaleFieldLabel
                ? (nextLocale, value) =>
                    updateTranslationField(nextLocale, 'download_button_label', value)
                : undefined
            }
            onTextareaKeyDown={handleTextareaKeyDown}
            onTextareaPaste={handleTextareaPaste}
            onTextareaScroll={handleTextareaScroll}
            onTitleChange={handleTitleChange}
            textareaRef={textareaRefs[locale]}
            translation={translations[locale]}
          />
        );
      })}

      {toastItems.length > 0 ? (
        <ToastViewport closeLabel="닫기" items={toastItems} onClose={closeToast} />
      ) : null}
    </section>
  );
};

const rootClass = css({
  width: 'full',
  maxWidth: '[88rem]',
  minWidth: '0',
  mx: 'auto',
  display: 'grid',
  gap: '5',
  px: '4',
  py: '8',
});

const metaStackClass = css({
  display: 'grid',
  gap: '6',
});

const tagSelectorClass = css({
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
  p: '4',
  mt: '2',
});

const actionRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  flexWrap: 'wrap',
  pb: '1',
});

const saveStatusClass = css({
  minHeight: '[1.5rem]',
  fontSize: 'sm',
  color: 'muted',
});

const buttonGroupClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

const localeTabListClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  minWidth: '0',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
});

const localeTabRecipe = cva({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '[2.875rem]',
    px: '2',
    pb: '3',
    fontSize: 'sm',
    fontWeight: 'semibold',
    lineHeight: 'tight',
    textAlign: 'center',
    transition: 'colors',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    active: {
      false: {
        color: 'muted',
      },
      true: {
        color: 'primary',
        _after: {
          content: '""',
          position: 'absolute',
          left: '0',
          right: '0',
          bottom: '[-1px]',
          height: '[2px]',
          background: 'primary',
        },
      },
    },
  },
});

const mobilePaneTabListClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  minWidth: '0',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
  '@media (min-width: 761px)': {
    display: 'none',
  },
});

const mobilePaneTabRecipe = cva({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    minHeight: '[2.875rem]',
    px: '1',
    pb: '3',
    fontSize: 'sm',
    fontWeight: 'semibold',
    transition: 'colors',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    active: {
      false: {
        color: 'muted',
      },
      true: {
        color: 'primary',
        _after: {
          content: '""',
          position: 'absolute',
          left: '0',
          right: '0',
          bottom: '[-1px]',
          height: '[2px]',
          background: 'primary',
        },
      },
    },
  },
});

const tabIconClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});
