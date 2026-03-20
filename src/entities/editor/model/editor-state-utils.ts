import {
  EDITOR_LOCALES,
  type EditorState,
  type EditorValidationResult,
  type Locale,
  type TranslationField,
} from '@/entities/editor/model/editor-types';

/**
 * locale 순서를 고정한 빈 번역 레코드를 생성합니다.
 */
export const createEmptyTranslations = (): Record<Locale, TranslationField> => ({
  en: {
    content: '',
    description: '',
    download_button_label: '',
    title: '',
  },
  fr: {
    content: '',
    description: '',
    download_button_label: '',
    title: '',
  },
  ja: {
    content: '',
    description: '',
    download_button_label: '',
    title: '',
  },
  ko: {
    content: '',
    description: '',
    download_button_label: '',
    title: '',
  },
});

/**
 * tags 비교 전에 순서/중복 영향을 제거합니다.
 */
export const normalizeTagSlugs = (tags: string[]) =>
  [...new Set(tags)].sort((left, right) => left.localeCompare(right));

/**
 * 저장/dirty 비교용 상태를 일관된 형태로 정규화합니다.
 */
export const normalizeEditorState = (state: EditorState): EditorState => ({
  dirty: state.dirty,
  slug: state.slug,
  tags: normalizeTagSlugs(state.tags),
  translations: EDITOR_LOCALES.reduce<Record<Locale, TranslationField>>((accumulator, locale) => {
    accumulator[locale] = {
      content: state.translations[locale]?.content ?? '',
      description: state.translations[locale]?.description ?? '',
      download_button_label: state.translations[locale]?.download_button_label ?? '',
      title: state.translations[locale]?.title ?? '',
    };

    return accumulator;
  }, createEmptyTranslations()),
});

/**
 * 현재 편집 상태와 기준 snapshot이 같은지 판별합니다.
 */
export const isEditorStateEqual = (left: EditorState, right: EditorState) => {
  if (left.slug !== right.slug) return false;

  const leftTags = normalizeTagSlugs(left.tags);
  const rightTags = normalizeTagSlugs(right.tags);

  if (leftTags.length !== rightTags.length) return false;

  for (let index = 0; index < leftTags.length; index += 1) {
    if (leftTags[index] !== rightTags[index]) return false;
  }

  return EDITOR_LOCALES.every(locale => {
    const leftTranslation = left.translations[locale];
    const rightTranslation = right.translations[locale];

    return (
      leftTranslation.title === rightTranslation.title &&
      leftTranslation.description === rightTranslation.description &&
      leftTranslation.content === rightTranslation.content &&
      (leftTranslation.download_button_label ?? '') ===
        (rightTranslation.download_button_label ?? '')
    );
  });
};

/**
 * locale별 제목/본문 상태를 검증하고 저장 가능 여부를 계산합니다.
 */
export const validateEditorState = (
  translations: Record<Locale, TranslationField>,
): EditorValidationResult => {
  let hasAnyCompleteTranslation = false;

  const localeValidation = EDITOR_LOCALES.reduce<
    Record<Locale, { hasCompleteTranslation: boolean; hasContentWithoutTitle: boolean }>
  >(
    (accumulator, locale) => {
      const translation = translations[locale];
      const hasTitle = translation.title.trim().length > 0;
      const hasContent = translation.content.trim().length > 0;
      const hasCompleteTranslation = hasTitle && hasContent;

      if (hasCompleteTranslation) {
        hasAnyCompleteTranslation = true;
      }

      accumulator[locale] = {
        hasCompleteTranslation,
        hasContentWithoutTitle: hasContent && !hasTitle,
      };

      return accumulator;
    },
    {
      en: { hasCompleteTranslation: false, hasContentWithoutTitle: false },
      fr: { hasCompleteTranslation: false, hasContentWithoutTitle: false },
      ja: { hasCompleteTranslation: false, hasContentWithoutTitle: false },
      ko: { hasCompleteTranslation: false, hasContentWithoutTitle: false },
    },
  );

  return {
    canSave:
      hasAnyCompleteTranslation &&
      EDITOR_LOCALES.every(locale => !localeValidation[locale].hasContentWithoutTitle),
    hasAnyCompleteTranslation,
    localeValidation,
  };
};

/**
 * 저장 완료 시각을 footer 표시에 맞는 HH:MM 문자열로 변환합니다.
 */
export const formatSavedAtLabel = (savedAt: string | null) => {
  if (!savedAt) return null;

  const date = new Date(savedAt);

  if (Number.isNaN(date.getTime())) return null;

  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
};
