import { defineRouting } from 'next-intl/routing';

/**
 * 앱에서 지원하는 locale 목록입니다.
 */
export const locales = ['ko', 'en', 'ja', 'fr'] as const;

/** locale 유지에 사용하는 쿠키 이름입니다. */
export const localeCookieName = 'NEXT_LOCALE';

/** 앱 전체에서 사용하는 locale 타입입니다. */
export type AppLocale = (typeof locales)[number];

/** 기본 locale입니다. */
export const defaultLocale: AppLocale = 'ko';

/** next-intl 라우팅 설정입니다. */
export const routing = defineRouting({
  defaultLocale,
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
    name: localeCookieName,
  },
  localePrefix: 'always',
  locales,
});

/**
 * 주어진 문자열이 지원되는 locale인지 확인합니다.
 */
export const isValidLocale = (locale: string): locale is AppLocale =>
  locales.includes(locale as AppLocale);
