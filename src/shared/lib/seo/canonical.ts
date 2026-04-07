import type { AppLocale } from '@/i18n/routing';
import { isValidLocale, locales } from '@/i18n/routing';

type ResolveCanonicalLocaleInput = {
  requestedLocale: AppLocale;
  resolvedLocale: string | null;
};

/**
 * 현재 요청이 fallback으로 렌더링됐더라도 실제로 선택된 번역 locale을 canonical로 사용합니다.
 */
export const resolveCanonicalLocale = ({
  requestedLocale,
  resolvedLocale,
}: ResolveCanonicalLocaleInput): AppLocale => {
  const normalizedResolvedLocale = resolvedLocale?.toLowerCase();

  if (normalizedResolvedLocale && isValidLocale(normalizedResolvedLocale)) {
    return normalizedResolvedLocale;
  }

  return requestedLocale;
};

/**
 * 지원 locale 목록을 순회하며 각 locale별 경로를 생성합니다.
 */
export const buildPathnameByLocale = (
  createPathname: (locale: AppLocale) => string,
): Partial<Record<AppLocale, string>> =>
  Object.fromEntries(locales.map(locale => [locale, createPathname(locale)])) as Partial<
    Record<AppLocale, string>
  >;
