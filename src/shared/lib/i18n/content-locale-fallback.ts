const CONTENT_LOCALE_FALLBACK_ORDER = ['ko', 'en', 'ja', 'fr'] as const;

/**
 * content 번역 조회에 사용할 locale fallback 순서를 구성합니다.
 *
 * 현재 데이터 모델에는 엔터티별 기본 locale 메타데이터가 없으므로,
 * 호출자가 넘긴 locale을 첫 번째 후보로 간주한 뒤 공통 fallback 순서를 이어 붙입니다.
 */
export const buildContentLocaleFallbackChain = (targetLocale: string): string[] => {
  const normalizedLocale = targetLocale.toLowerCase();

  return [normalizedLocale, ...CONTENT_LOCALE_FALLBACK_ORDER].filter(
    (locale, index, locales) => locales.indexOf(locale) === index,
  );
};

/**
 * locale 후보 목록을 순서대로 조회해 첫 번째 유효 결과를 반환합니다.
 */
export const resolveFirstAvailableLocaleValue = async <T>({
  fetchByLocale,
  hasValue,
  locales,
}: {
  fetchByLocale: (locale: string) => Promise<T>;
  hasValue: (value: T) => boolean;
  locales: string[];
}): Promise<T | null> => {
  for (const locale of locales) {
    const value = await fetchByLocale(locale);
    if (hasValue(value)) return value;
  }

  return null;
};
