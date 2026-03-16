import { getSupabaseAdminEnvOptional, hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import 'server-only';

import { isAdminSupabaseUser } from './is-admin-supabase-user';

export type AuthState = {
  isAdmin: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: string | null;
};

const EMPTY_AUTH_STATE: AuthState = {
  isAdmin: false,
  isAuthenticated: false,
  userEmail: null,
  userId: null,
};

/**
 * 에러 메시지가 세션 누락 또는 무효한 refresh token 상황인지 판별합니다.
 *
 * @param message 검사할 인증 에러 메시지입니다. 내부에서 소문자로 정규화한 뒤 세션 누락/리프레시 토큰 관련 문구 포함 여부를 확인합니다.
 * @returns 메시지가 `auth session missing`, `invalid refresh token`, `refresh token not found` 조건 중 하나에 맞으면 `true`를 반환합니다.
 */
const isMissingSessionError = (message: string | null | undefined) => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  return (
    normalizedMessage.includes('auth session missing') ||
    normalizedMessage.includes('invalid refresh token') ||
    normalizedMessage.includes('refresh token not found')
  );
};

/**
 * 현재 요청의 Supabase 세션을 읽어 관리자 여부를 포함한 인증 상태를 반환합니다.
 */
export const getServerAuthState = async (): Promise<AuthState> => {
  if (!hasSupabaseEnv()) return EMPTY_AUTH_STATE;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isMissingSessionError(error.message)) {
    throw new Error(`[auth] 사용자 조회 실패: ${error.message}`);
  }
  if (!user) return EMPTY_AUTH_STATE;

  const adminIdentity = getSupabaseAdminEnvOptional();

  return {
    isAdmin: isAdminSupabaseUser(user, adminIdentity),
    isAuthenticated: true,
    userEmail: user.email ?? null,
    userId: user.id,
  };
};
