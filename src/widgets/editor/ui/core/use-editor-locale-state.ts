import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Locale, TranslationField } from '@/widgets/editor/ui/core/editor-core.types';
import { rememberTextareaScroll } from '@/widgets/editor/ui/core/editor-core-textarea';

type UseEditorLocaleStateParams = {
  initialLocale?: Locale;
  initialTranslations: Record<Locale, TranslationField>;
};

type UseEditorLocaleStateResult = {
  activeLocale: Locale;
  handleLocaleChange: (nextLocale: Locale) => void;
  handleTextareaScroll: (locale: Locale, scrollTop: number) => void;
  textareaRefs: Record<Locale, MutableRefObject<HTMLTextAreaElement | null>>;
  translations: Record<Locale, TranslationField>;
  updateTranslationField: (locale: Locale, field: keyof TranslationField, value: string) => void;
};

/**
 * EditorCore의 locale 전환, 번역 필드 수정, textarea scroll 복원 상태를 관리합니다.
 *
 * @param initialLocale 최초 활성화할 locale입니다.
 * @param initialTranslations locale별 초기 번역 필드 값입니다.
 * @returns 활성 locale, 번역 상태, scroll 복원용 ref와 갱신 핸들러를 반환합니다.
 */
export const useEditorLocaleState = ({
  initialLocale = 'ko',
  initialTranslations,
}: UseEditorLocaleStateParams): UseEditorLocaleStateResult => {
  const [activeLocale, setActiveLocale] = useState<Locale>(initialLocale);
  const [translations, setTranslations] =
    useState<Record<Locale, TranslationField>>(initialTranslations);
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

  useEffect(() => {
    const textarea = textareaRefs[activeLocale].current;

    if (!textarea) return;

    textarea.scrollTop = scrollTopByLocaleRef.current[activeLocale];
  }, [activeLocale, textareaRefs]);

  /**
   * locale별 번역 필드를 변경하되 값이 같으면 기존 객체를 재사용합니다.
   */
  const updateTranslationField = useCallback(
    (locale: Locale, field: keyof TranslationField, value: string) => {
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
   * locale 전환 전 현재 textarea의 scrollTop을 저장한 뒤 다음 locale로 이동합니다.
   */
  const handleLocaleChange = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === activeLocale) return;

      rememberTextareaScroll(activeLocale, scrollTopByLocaleRef, textareaRefs);
      setActiveLocale(nextLocale);
    },
    [activeLocale, textareaRefs],
  );

  /**
   * 현재 locale textarea의 스크롤 위치를 기억합니다.
   */
  const handleTextareaScroll = useCallback((locale: Locale, scrollTop: number) => {
    scrollTopByLocaleRef.current[locale] = scrollTop;
  }, []);

  return {
    activeLocale,
    handleLocaleChange,
    handleTextareaScroll,
    textareaRefs,
    translations,
    updateTranslationField,
  };
};
