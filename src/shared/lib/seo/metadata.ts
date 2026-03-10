import type { Metadata } from 'next';

import { type AppLocale, locales } from '@/i18n/routing';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';

/**
 * SEO canonical 및 x-default 계산에 사용하는 기준 locale입니다.
 */
export const seoDefaultLocale: AppLocale = 'en';

type BuildLocaleAlternatesInput = {
  canonicalLocale: AppLocale;
  pathnameByLocale: Partial<Record<AppLocale, string>>;
};

/**
 * locale별 절대 alternate URL 맵을 생성합니다.
 */
export const buildLocaleAlternates = ({
  canonicalLocale,
  pathnameByLocale,
}: BuildLocaleAlternatesInput): NonNullable<Metadata['alternates']> => {
  const languages = Object.fromEntries(
    locales.map(locale => {
      const pathname = pathnameByLocale[locale];
      return [locale, pathname ? buildAbsoluteSiteUrl(pathname) : undefined];
    }),
  ) as Record<string, string | undefined>;

  return {
    canonical: buildAbsoluteSiteUrl(pathnameByLocale[canonicalLocale] ?? `/${canonicalLocale}`),
    languages: {
      ...languages,
      'x-default': buildAbsoluteSiteUrl(
        pathnameByLocale[seoDefaultLocale] ?? `/${seoDefaultLocale}`,
      ),
    },
  };
};

type BuildLocalizedPathnameInput = {
  locale: AppLocale;
  pathname?: string;
};

/**
 * locale prefix가 포함된 경로를 생성합니다.
 */
export const buildLocalizedPathname = ({
  locale,
  pathname = '/',
}: BuildLocalizedPathnameInput): string => {
  const normalizedPathname = pathname === '/' ? '' : pathname;

  return `/${locale}${normalizedPathname}`;
};
