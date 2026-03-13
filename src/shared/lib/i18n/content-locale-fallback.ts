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
 * locale fallback 순서에 따라 후보 행 중 우선순위가 가장 높은 값을 고릅니다.
 *
 * 목록/아카이브처럼 base row는 이미 정해져 있고, 각 row마다 번역 후보만 여러 개인 경우에 사용합니다.
 *
 * @param locales - 요청 locale이 앞에 배치된 fallback 우선순위 목록
 * @param resolveLocale - 후보 행에서 locale 문자열을 읽는 함수
 * @param rows - 같은 엔터티에 속한 번역 후보 행 배열
 * @returns fallback 우선순위에 따라 선택된 행 또는 null
 */
export const pickPreferredLocaleValue = <T>({
  locales,
  resolveLocale,
  rows,
}: {
  locales: string[];
  resolveLocale: (row: T) => string;
  rows: T[];
}): T | null => {
  const normalizedLocales = locales.map(locale => locale.toLowerCase());

  for (const locale of normalizedLocales) {
    const matchedRow = rows.find(row => resolveLocale(row).toLowerCase() === locale);
    if (matchedRow) return matchedRow;
  }

  return null;
};
