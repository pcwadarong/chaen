const ARTICLE_TRANSLATION_FALLBACK_ORDER = ['ko', 'en', 'ja', 'fr'] as const;

/**
 * 아티클 번역 조회에 사용할 locale fallback 순서를 구성합니다.
 *
 * 현재 데이터 모델에는 아티클별 기본 locale 메타데이터가 없으므로,
 * 호출자가 넘긴 locale을 첫 번째 후보로 간주한 뒤 `ko -> en -> ja -> fr`
 */
export const buildArticleLocaleFallbackChain = (targetLocale: string): string[] => {
  const normalizedLocale = targetLocale.toLowerCase();
  return [normalizedLocale, ...ARTICLE_TRANSLATION_FALLBACK_ORDER].filter(
    (locale, index, locales) => locales.indexOf(locale) === index,
  );
};
