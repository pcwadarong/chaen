import type { AppLocale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { seoDefaultLocale } from '@/shared/lib/seo/metadata';

type ResolveCanonicalLocaleInput = {
  requestedLocale: AppLocale;
  resolvedLocale: string | null;
};

/**
 * 현재 요청 locale에 실제 번역이 있으면 자기 자신을 canonical로 사용하고,
 * fallback으로 렌더링됐다면 SEO 기본 locale(`en`)을 canonical로 사용합니다.
 */
export const resolveCanonicalLocale = ({
  requestedLocale,
  resolvedLocale,
}: ResolveCanonicalLocaleInput): AppLocale => {
  if (resolvedLocale?.toLowerCase() === requestedLocale) {
    return requestedLocale;
  }

  return seoDefaultLocale;
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
