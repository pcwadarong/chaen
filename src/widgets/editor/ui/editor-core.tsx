'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
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
import { MarkdownToolbar } from '@/features/markdown-toolbar/ui/markdown-toolbar';
import { getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';
import { Button } from '@/shared/ui/button/button';
import { ChevronRightIcon, EditIcon, EyeIcon } from '@/shared/ui/icons/app-icons';
import { TagSelector } from '@/shared/ui/tag-selector/tag-selector';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type EditorCoreProps,
  type EditorState,
  type Locale,
  type MobileEditorPane,
} from '@/widgets/editor/model/editor-core.types';
import {
  createEmptyTranslations,
  formatSavedAtLabel,
  isEditorStateEqual,
  validateEditorState,
} from '@/widgets/editor/model/editor-core.utils';

const AUTOSAVE_DELAY_MS = 180_000;
const MOBILE_MEDIA_QUERY = '(max-width: 760px)';
const EDITOR_PANE_MAX_HEIGHT = '[min(70vh,44rem)]';
const MOBILE_EDITOR_PANE_MAX_HEIGHT = '[60vh]';
const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ja: 'JA',
  ko: 'KO',
};

type SaveSource = 'autosave' | 'manual';

/**
 * `window.matchMedia` 기반으로 모바일 전용 editor mode 적용 여부를 추적합니다.
 */
const useIsMobileEditorLayout = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile;
};

/**
 * 편집 상태를 callback 계약에 맞는 snapshot으로 구성합니다.
 */
const buildEditorStateSnapshot = ({
  dirty,
  slug,
  tags,
  translations,
}: Pick<EditorState, 'dirty' | 'slug' | 'tags' | 'translations'>): EditorState => ({
  dirty,
  slug,
  tags,
  translations: EDITOR_LOCALES.reduce<Record<Locale, EditorState['translations'][Locale]>>(
    (accumulator, locale) => {
      accumulator[locale] = {
        content: translations[locale]?.content ?? '',
        description: translations[locale]?.description ?? '',
        title: translations[locale]?.title ?? '',
      };

      return accumulator;
    },
    createEmptyTranslations(),
  ),
});

/**
 * 저장 실패/검증 실패 토스트를 구성합니다.
 */
const createSaveErrorToast = (message: string): ToastItem => ({
  id: `save-error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  message,
  tone: 'error',
});

/**
 * 저장 완료 시각으로 사용할 현재 시각 문자열을 생성합니다.
 */
const createTimestamp = () => new Date().toISOString();

/**
 * draft 저장 callback의 반환값에서 마지막 저장 시각을 추출합니다.
 */
const resolveSavedAt = (result: DraftSaveResult | void) => result?.savedAt ?? createTimestamp();

/**
 * 숨겨진 panel에서 먼저 마운트된 textarea 높이를 현재 내용 기준으로 다시 계산합니다.
 */
const resizeTextareaToContent = (element: HTMLTextAreaElement | null) => {
  if (!element) return;

  element.style.height = '0px';
  element.style.height = `${element.scrollHeight}px`;
};

/**
 * 현재 locale textarea scrollTop을 기억합니다.
 */
const rememberTextareaScroll = (
  locale: Locale,
  scrollTopByLocaleRef: React.RefObject<Record<Locale, number>>,
  textareaRefs: Record<Locale, React.RefObject<HTMLTextAreaElement | null>>,
) => {
  scrollTopByLocaleRef.current[locale] = textareaRefs[locale].current?.scrollTop ?? 0;
};

type EditorLocalePanelProps = {
  activeLocaleHasTitleError: boolean;
  isActive: boolean;
  isMobileLayout: boolean;
  locale: Locale;
  mobileEditorPane: MobileEditorPane;
  markdownOptions: ReturnType<typeof getMarkdownOptions>;
  onContentChange: (locale: Locale, value: string) => void;
  onDescriptionChange: (locale: Locale, value: string) => void;
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
  isActive,
  isMobileLayout,
  locale,
  mobileEditorPane,
  markdownOptions,
  onContentChange,
  onDescriptionChange,
  onTextareaKeyDown,
  onTextareaPaste,
  onTextareaScroll,
  onTitleChange,
  textareaRef,
  translation,
}: EditorLocalePanelProps) => {
  const localeLabel = LOCALE_LABELS[locale];
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    resizeTextareaToContent(titleTextareaRef.current);
    resizeTextareaToContent(descriptionTextareaRef.current);
  }, [isActive, translation.description, translation.title]);

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
            className={textareaInfoClass}
            aria-describedby={
              activeLocaleHasTitleError ? `editor-title-error-${locale}` : undefined
            }
            aria-invalid={activeLocaleHasTitleError ? true : undefined}
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
      </div>

      <div className={editorGridClass}>
        <section
          aria-label="본문 편집"
          className={editorPaneClass}
          hidden={isMobileLayout && mobileEditorPane !== 'edit'}
          id={isMobileLayout ? `editor-pane-edit-${locale}` : undefined}
        >
          <div className={editorToolbarWrapClass}>
            <MarkdownToolbar
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
          {translation.content.trim().length > 0 ? (
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

const EditorLocalePanel = React.memo(EditorLocalePanelBase);

/**
 * locale별 textarea 편집 상호작용을 구성합니다.
 */
export const EditorCore = ({
  availableTags,
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
            {LOCALE_LABELS[locale]}
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

const textareaInfoClass = css({
  minHeight: '[2.7rem]',
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
  '@media (max-width: 760px)': {
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
  alignItems: 'stretch',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
  },
});

const editorPaneClass = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  minHeight: '[36rem]',
  maxHeight: EDITOR_PANE_MAX_HEIGHT,
  overflow: 'hidden',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
  '@media (max-width: 760px)': {
    minHeight: '[28rem]',
    maxHeight: MOBILE_EDITOR_PANE_MAX_HEIGHT,
  },
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
  minHeight: '[36rem]',
  maxHeight: EDITOR_PANE_MAX_HEIGHT,
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
  '@media (max-width: 760px)': {
    minHeight: '[28rem]',
    maxHeight: MOBILE_EDITOR_PANE_MAX_HEIGHT,
  },
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
