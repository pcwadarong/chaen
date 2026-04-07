import { redirect } from 'next/navigation';

import { buildAdminPath } from '@/features/admin-session/model/admin-path';
import { type AuthState, getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import 'server-only';

type RequireAdminOptions = {
  locale?: string | null;
  onUnauthorized?: 'redirect' | 'throw';
};

/**
 * 관리자 전용 서버 경계에서 세션을 확인합니다.
 * 페이지에서는 로그인 화면으로 리다이렉트하고,
 * route/action에서는 `throw` 모드로 403 처리에 재사용합니다.
 */
export const requireAdmin = async (options: RequireAdminOptions = {}): Promise<AuthState> => {
  const authState = await getServerAuthState();

  if (authState.isAdmin) return authState;
  if (options.onUnauthorized === 'throw') throw new AdminAuthorizationError();

  redirect(buildAdminPath({ section: 'login' }));
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
