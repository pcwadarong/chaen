'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css, cva } from 'styled-system/css';

import { EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
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
import { Input } from '@/shared/ui/input/input';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
 * 현재 locale textarea scrollTop을 기억합니다.
 */
const rememberTextareaScroll = (
  locale: Locale,
  scrollTopByLocaleRef: React.RefObject<Record<Locale, number>>,
  textareaRefs: Record<Locale, React.RefObject<HTMLTextAreaElement | null>>,
) => {
  scrollTopByLocaleRef.current[locale] = textareaRefs[locale].current?.scrollTop ?? 0;
};

/**
 * locale별 textarea 편집 상호작용을 구성합니다.
 */
export const EditorCore = ({
  availableTags,
  initialSavedAt = null,
  initialSlug = '',
  initialTags,
  initialTranslations,
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
      } catch {
        if (saveRequestIdRef.current !== requestId) return;

        pushToast(createSaveErrorToast(EDITOR_ERROR_MESSAGE.draftSaveFailed));
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
  const handleLocaleChange = (nextLocale: Locale) => {
    rememberTextareaScroll(activeLocale, scrollTopByLocaleRef, textareaRefs);
    setActiveLocale(nextLocale);
  };

  /**
   * 제목 입력을 locale별로 갱신합니다.
   */
  const handleTitleChange = (locale: Locale, value: string) => {
    setTranslations(previous => ({
      ...previous,
      [locale]: {
        ...previous[locale],
        title: value,
      },
    }));
  };

  /**
   * 설명 입력을 locale별로 갱신합니다.
   */
  const handleDescriptionChange = (locale: Locale, value: string) => {
    setTranslations(previous => ({
      ...previous,
      [locale]: {
        ...previous[locale],
        description: value,
      },
    }));
  };

  /**
   * 본문 입력을 locale별로 갱신합니다.
   */
  const handleContentChange = (locale: Locale, value: string) => {
    setTranslations(previous => ({
      ...previous,
      [locale]: {
        ...previous[locale],
        content: value,
      },
    }));
  };

  /**
   * URL 붙여넣기와 텍스트+URL 붙여넣기를 markdown 링크 문법으로 변환합니다.
   */
  const handleTextareaPaste =
    (locale: Locale): React.ClipboardEventHandler<HTMLTextAreaElement> =>
    event => {
      const currentValue = translations[locale].content;
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
    };

  /**
   * markdown 목록 계열의 Enter/Tab 편집 보조 규칙을 유지합니다.
   */
  const handleTextareaKeyDown =
    (locale: Locale): React.KeyboardEventHandler<HTMLTextAreaElement> =>
    event => {
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
    };

  return (
    <section className={rootClass}>
      <div className={metaStackClass}>
        <div className={actionRowClass}>
          <p aria-live="polite" className={saveStatusClass} role="status">
            {saveStatusLabel}
          </p>
          <div className={buttonGroupClass}>
            {onDraftSave ? (
              <Button
                disabled={isSaving}
                onClick={() => void runDraftSave('manual')}
                size="sm"
                tone="white"
              >
                임시저장
              </Button>
            ) : null}
            <Button
              onClick={() =>
                onOpenPublishPanel(
                  buildEditorStateSnapshot({
                    dirty,
                    slug,
                    tags: selectedTags,
                    translations,
                  }),
                )
              }
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
        const translation = translations[locale];

        return (
          <section
            aria-labelledby={`editor-tab-${locale}`}
            className={localePanelClass}
            hidden={!isActive}
            id={`editor-panel-${locale}`}
            key={locale}
            role="tabpanel"
          >
            <div className={titleFieldClass}>
              <label className={fieldLabelClass} htmlFor={`editor-title-${locale}`}>
                제목
              </label>
              <Input
                aria-describedby={
                  activeLocaleHasTitleError && isActive ? `editor-title-error-${locale}` : undefined
                }
                aria-invalid={isActive && activeLocaleHasTitleError ? true : undefined}
                id={`editor-title-${locale}`}
                onChange={event => handleTitleChange(locale, event.target.value)}
                placeholder={`${LOCALE_LABELS[locale]} 제목`}
                value={translation.title}
              />
              {isActive && activeLocaleHasTitleError ? (
                <p className={titleErrorClass} id={`editor-title-error-${locale}`} role="alert">
                  제목을 입력해주세요
                </p>
              ) : null}
            </div>

            <div className={descriptionFieldClass}>
              <label className={fieldLabelClass} htmlFor={`editor-description-${locale}`}>
                설명
              </label>
              <Input
                id={`editor-description-${locale}`}
                onChange={event => handleDescriptionChange(locale, event.target.value)}
                placeholder={`${LOCALE_LABELS[locale]} 설명`}
                value={translation.description}
              />
            </div>

            <div className={editorGridClass}>
              <section
                className={editorPaneClass}
                hidden={isMobileLayout && mobileEditorPane !== 'edit'}
                id={isMobileLayout ? `editor-pane-edit-${locale}` : undefined}
              >
                <MarkdownToolbar
                  onChange={nextValue => handleContentChange(locale, nextValue)}
                  textareaRef={textareaRefs[locale]}
                  value={translation.content}
                />
                <Textarea
                  aria-label="본문 입력"
                  autoResize={false}
                  className={editorTextareaClass}
                  onChange={event => handleContentChange(locale, event.target.value)}
                  onKeyDown={handleTextareaKeyDown(locale)}
                  onPaste={handleTextareaPaste(locale)}
                  onScroll={event => {
                    scrollTopByLocaleRef.current[locale] = event.currentTarget.scrollTop;
                  }}
                  placeholder="마크다운 본문을 입력하세요"
                  ref={textareaRefs[locale]}
                  rows={18}
                  value={translation.content}
                />
              </section>

              <section
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
      })}

      {toastItems.length > 0 ? (
        <ToastViewport
          closeLabel="닫기"
          items={toastItems}
          onClose={id => setToastItems(previous => previous.filter(item => item.id !== id))}
        />
      ) : null}
    </section>
  );
};

const rootClass = css({
  width: 'full',
  maxWidth: '[88rem]',
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
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
});

const localeTabRecipe = cva({
  base: {
    position: 'relative',
    minHeight: '[2.875rem]',
    px: '2',
    pb: '3',
    fontSize: 'sm',
    fontWeight: 'semibold',
    lineHeight: 'tight',
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
  display: 'flex',
  alignItems: 'center',
  gap: '4',
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
});

const titleFieldClass = css({
  display: 'grid',
  gap: '2',
});

const descriptionFieldClass = css({
  display: 'grid',
  gap: '2',
  mt: '4',
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
  alignItems: 'stretch',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
  },
});

const editorPaneClass = css({
  display: 'grid',
  gap: '3',
  minHeight: '[36rem]',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
});

const previewPaneClass = css({
  minHeight: '[36rem]',
  overflowY: 'auto',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surfaceMuted',
});

const editorTextareaClass = css({
  minHeight: '[30rem]',
  height: 'full',
  resize: 'none',
  overflowY: 'auto',
  fontFamily: 'mono',
});

const emptyPreviewClass = css({
  fontSize: 'sm',
  color: 'muted',
});
