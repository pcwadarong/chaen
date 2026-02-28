import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { defaultLocale, isValidLocale, localeCookieName } from '@/i18n/routing';

/**
 * locale 세그먼트가 없는 루트 요청을 마지막 선택 locale로 보냅니다.
 */
const RootPage = async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(localeCookieName)?.value;
  const locale = savedLocale && isValidLocale(savedLocale) ? savedLocale : defaultLocale;

  redirect(`/${locale}`);
};

export default RootPage;
