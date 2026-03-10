import { getTranslations } from 'next-intl/server';

import { type AppLocale, defaultLocale, isValidLocale } from '@/i18n/routing';

type GetActionTranslationsParams<TNamespace extends string> = {
  locale?: string | null;
  namespace: TNamespace;
};

/**
 * Server Action 입력에서 locale 값을 안전한 앱 locale로 정규화합니다.
 */
export const resolveActionLocale = (locale?: string | null): AppLocale => {
  const normalizedLocale = locale?.trim().toLowerCase();

  if (!normalizedLocale || !isValidLocale(normalizedLocale)) {
    return defaultLocale;
  }

  return normalizedLocale;
};

/**
 * Server Action에서 사용할 locale별 번역 함수를 반환합니다.
 */
export const getActionTranslations = async <TNamespace extends string>({
  locale,
  namespace,
}: GetActionTranslationsParams<TNamespace>) =>
  getTranslations({
    locale: resolveActionLocale(locale),
    namespace,
  });
