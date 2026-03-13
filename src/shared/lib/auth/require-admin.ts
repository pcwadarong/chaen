import { redirect } from 'next/navigation';

import { resolveActionLocale } from '@/shared/lib/i18n/get-action-translations';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';

import 'server-only';

import { type AuthState, getServerAuthState } from './get-server-auth-state';

type RequireAdminOptions = {
  locale?: string | null;
  onUnauthorized?: 'redirect' | 'throw';
};

/**
 * 관리자 전용 서버 경계에서 세션을 확인합니다.
 * 페이지에서는 로그인 화면으로 리다이렉트하고,
 * route/action에서는 `throw` 모드로 403 처리에 재사용합니다.
 */
export const requireAdmin = async ({
  locale,
  onUnauthorized = 'redirect',
}: RequireAdminOptions = {}): Promise<AuthState> => {
  const authState = await getServerAuthState();

  if (authState.isAdmin) {
    return authState;
  }

  if (onUnauthorized === 'throw') {
    throw new AdminAuthorizationError();
  }

  redirect(
    buildLocalizedPathname({
      locale: resolveActionLocale(locale),
      pathname: '/admin/login',
    }),
  );
};

/**
 * 관리자 권한이 없는 요청을 route/action에서 403으로 변환하기 위한 에러입니다.
 */
export class AdminAuthorizationError extends Error {
  statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AdminAuthorizationError';
  }
}
