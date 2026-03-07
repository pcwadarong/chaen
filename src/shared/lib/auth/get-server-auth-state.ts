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
 * 현재 요청의 Supabase 세션을 읽어 관리자 여부를 포함한 인증 상태를 반환합니다.
 */
export const getServerAuthState = async (): Promise<AuthState> => {
  if (!hasSupabaseEnv()) return EMPTY_AUTH_STATE;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(`[auth] 사용자 조회 실패: ${error.message}`);
  if (!user) return EMPTY_AUTH_STATE;

  const adminIdentity = getSupabaseAdminEnvOptional();

  return {
    isAdmin: isAdminSupabaseUser(user, adminIdentity),
    isAuthenticated: true,
    userEmail: user.email ?? null,
    userId: user.id,
  };
};
