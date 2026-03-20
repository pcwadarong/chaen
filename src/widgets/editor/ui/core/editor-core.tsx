'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cva } from 'styled-system/css';

import { EDITOR_ERROR_MESSAGE, parseEditorError } from '@/entities/editor/model/editor-error';
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
  createSaveErrorToast,
  resolveSavedAt,
} from '@/widgets/editor/ui/core/editor-core-state';
import { rememberTextareaScroll } from '@/widgets/editor/ui/core/editor-core-textarea';
import { EditorLocalePanel } from '@/widgets/editor/ui/core/editor-locale-panel';
import { useIsMobileEditorLayout } from '@/widgets/editor/ui/core/use-mobile-editor-layout';

const AUTOSAVE_DELAY_MS = 180_000;
type SaveSource = 'autosave' | 'manual';

/**
 * locale별 textarea 편집 상호작용을 구성합니다.
 */
export const EditorCore = ({
  availableTags,
  contentType,
  initialSavedAt = null,
  initialSlug = '',
  initialTags,
  initialTranslations,
  hideAppFrameFooter = false,
  onDraftSave,
  onOpenPublishPanel,
}: EditorCoreProps) => {
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [mobileEditorPane, setMobileEditorPane] = useState<MobileEditorPane>('edit');
  const [slug] = useState(initialSlug);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [translations, setTranslations] = useState(
    buildEditorStateSnapshot({
      dirty: false,
      slug: initialSlug,
      tags: initialTags,
      translations: {
        ...createEmptyTranslations(),
        ...initialTranslations,
      },
    }).translations,
  );
  const [savedState, setSavedState] = useState<EditorState>(() =>
    buildEditorStateSnapshot({
      dirty: false,
      slug: initialSlug,
      tags: initialTags,
      translations: {
        ...createEmptyTranslations(),
        ...initialTranslations,
      },
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSavedAt);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const saveRequestIdRef = useRef(0);
  const scrollTopByLocaleRef = useRef<Record<Locale, number>>({
    en: 0,
    fr: 0,
    ja: 0,
    ko: 0,
  });
  const enTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const frTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const jaTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const koTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRefs = useMemo(
    () => ({
      en: enTextareaRef,
      fr: frTextareaRef,
      ja: jaTextareaRef,
      ko: koTextareaRef,
    }),
    [],
  );
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
  const saveStatusLabel = useMemo(() => {
    if (isSaving) return '저장 중...';
    if (dirty) return '변경사항 있음';

    const formattedSavedAt = formatSavedAtLabel(lastSavedAt);

    return formattedSavedAt ? `저장됨 ${formattedSavedAt}` : '';
  }, [dirty, isSaving, lastSavedAt]);

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
   * active locale을 다시 열 때 직전 scrollTop을 복원합니다.
   */
  useEffect(() => {
    const textarea = textareaRefs[activeLocale].current;

    if (!textarea) return;

    textarea.scrollTop = scrollTopByLocaleRef.current[activeLocale];
  }, [activeLocale, textareaRefs]);

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

  /**
   * locale별 번역 필드를 변경하되 값이 같으면 기존 객체를 재사용합니다.
   */
  const updateTranslationField = useCallback(
    (locale: Locale, field: keyof EditorState['translations'][Locale], value: string) => {
      setTranslations(previous => {
        if (previous[locale][field] === value) return previous;

        return {
          ...previous,
          [locale]: {
            ...previous[locale],
            [field]: value,
          },
        };
      });
    },
    [],
  );

  /**
   * 현재 편집 상태가 저장 가능한지 확인하고, 실패 시 필요한 피드백을 적용합니다.
   */
  const ensureSavable = useCallback(
    (source: SaveSource) => {
      if (validationResult.canSave) return true;

      if (source === 'manual') {
        pushToast(
          createSaveErrorToast(`저장하려면 ${EDITOR_ERROR_MESSAGE.missingCompleteTranslation}`),
        );
      }

      return false;
    },
    [pushToast, validationResult.canSave],
  );

  /**
   * manual/autosave 모두 같은 저장 경로를 사용합니다.
   */
  const runDraftSave = useCallback(
    async (source: SaveSource) => {
      if (!onDraftSave || !ensureSavable(source)) return;

      const requestId = ++saveRequestIdRef.current;
      const requestState = buildEditorStateSnapshot({
        dirty,
        slug,
        tags: selectedTags,
        translations,
      });

      setIsSaving(true);

      try {
        const result = await onDraftSave(requestState);

        if (saveRequestIdRef.current !== requestId) return;

        setSavedState({ ...requestState, dirty: false });
        setLastSavedAt(resolveSavedAt(result));
      } catch (error) {
        if (saveRequestIdRef.current !== requestId) return;

        const parsedError = parseEditorError(error, 'draftSaveFailed');
        pushToast(createSaveErrorToast(parsedError.message));
      } finally {
        if (saveRequestIdRef.current === requestId) {
          setIsSaving(false);
        }
      }
    },
    [dirty, ensureSavable, onDraftSave, pushToast, selectedTags, slug, translations],
  );

  /**
   * autosave 기준을 만족하면 마지막 입력 후 180초 뒤 draft save를 실행합니다.
   */
  useEffect(() => {
    if (!onDraftSave || !dirty) return;
    if (!validationResult.canSave) return;

    const timeoutId = window.setTimeout(() => {
      void runDraftSave('autosave');
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dirty, onDraftSave, runDraftSave, validationResult.canSave]);

  /**
   * locale 전환 전 현재 textarea scrollTop을 저장합니다.
   */
  const handleLocaleChange = useCallback(
    (nextLocale: Locale) => {
      rememberTextareaScroll(activeLocale, scrollTopByLocaleRef, textareaRefs);
      setActiveLocale(nextLocale);
    },
    [activeLocale, textareaRefs],
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
  const handleTextareaScroll = useCallback((locale: Locale, scrollTop: number) => {
    scrollTopByLocaleRef.current[locale] = scrollTop;
  }, []);
  const handleManualSave = useCallback(() => {
    void runDraftSave('manual');
  }, [runDraftSave]);
  const handleOpenPublishPanel = useCallback(() => {
    onOpenPublishPanel(
      buildEditorStateSnapshot({
        dirty,
        slug,
        tags: selectedTags,
        translations,
      }),
    );
  }, [dirty, onOpenPublishPanel, selectedTags, slug, translations]);

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
            <Button
              onClick={handleOpenPublishPanel}
              size="sm"
              tone="primary"
              trailingVisual={<ChevronRightIcon aria-hidden color="current" size="md" />}
            >
              발행하기
            </Button>
          </div>
        </div>
        <TagSelector
          availableTags={availableTags}
          className={tagSelectorClass}
          onChange={setSelectedTags}
          selectedTagSlugs={selectedTags}
        />
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
            isActive={isActive}
            isMobileLayout={isMobileLayout}
            key={locale}
            locale={locale}
            markdownOptions={markdownOptions}
            mobileEditorPane={mobileEditorPane}
            onContentChange={handleContentChange}
            onDescriptionChange={handleDescriptionChange}
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
