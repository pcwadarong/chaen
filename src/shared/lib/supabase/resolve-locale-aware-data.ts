export type LocaleAwareQueryResult<T> = {
  data: T;
  localeColumnMissing: boolean;
};

type ResolveLocaleAwareDataParams<T> = {
  emptyData: T;
  fallbackLocale?: string;
  fetchByLocale: (locale: string) => Promise<LocaleAwareQueryResult<T>>;
  fetchLegacy: () => Promise<T>;
  isEmptyData: (data: T) => boolean;
  targetLocale: string;
};

const LOCALE_COLUMN_MISSING_PATTERN = /column .*locale.* does not exist/i;

/**
 * Supabase 에러 메시지가 locale 컬럼 미존재와 관련된 오류인지 판별합니다.
 */
export const isLocaleColumnMissingError = (errorMessage: string): boolean =>
  LOCALE_COLUMN_MISSING_PATTERN.test(errorMessage);

/**
 * locale 우선 조회 전략을 공통화합니다.
 *
 * 우선순위:
 * 1) 요청 locale 조회
 * 2) locale 컬럼이 없으면 legacy 조회
 * 3) 결과가 비어 있고 요청 locale이 fallback locale과 다르면 fallback locale 조회
 * 4) fallback에서도 locale 컬럼이 없으면 legacy 조회
 * 5) 모두 비어 있으면 emptyData 반환
 */
export const resolveLocaleAwareData = async <T>(
  params: ResolveLocaleAwareDataParams<T>,
): Promise<T> => {
  const {
    emptyData,
    fallbackLocale = 'en',
    fetchByLocale,
    fetchLegacy,
    isEmptyData,
    targetLocale,
  } = params;

  const normalizedTargetLocale = targetLocale.toLowerCase();
  const normalizedFallbackLocale = fallbackLocale.toLowerCase();

  const localizedResult = await fetchByLocale(normalizedTargetLocale);
  if (localizedResult.localeColumnMissing) return fetchLegacy();

  if (!isEmptyData(localizedResult.data)) {
    return localizedResult.data;
  }

  if (normalizedTargetLocale !== normalizedFallbackLocale) {
    const fallbackResult = await fetchByLocale(normalizedFallbackLocale);
    if (fallbackResult.localeColumnMissing) return fetchLegacy();

    if (!isEmptyData(fallbackResult.data)) {
      return fallbackResult.data;
    }
  }

  return emptyData;
};
