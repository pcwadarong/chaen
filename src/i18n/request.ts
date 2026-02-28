import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, isValidLocale } from '@/i18n/routing';

/**
 * 요청별 locale과 메시지 번들을 해석합니다.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && isValidLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
