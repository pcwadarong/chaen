import { createClient } from '@supabase/supabase-js';

import { getSupabaseEnv, getSupabaseEnvOptional } from '@/lib/supabase/config';

import 'server-only';

/**
 * 서버 전용 읽기/스토리지 접근에 사용하는 Supabase 클라이언트를 생성합니다.
 * 인증 쿠키와 분리되어 있어 캐시 함수(`unstable_cache`) 내부에서도 안전하게 호출할 수 있습니다.
 */
export const createPublicServerSupabaseClient = () => {
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * 환경변수가 있는 경우에만 서버 전용 읽기 Supabase 클라이언트를 생성합니다.
 * 프리렌더 환경 등에서 env가 없을 때는 `null`을 반환해 호출부에서 fallback 처리할 수 있습니다.
 */
export const createOptionalPublicServerSupabaseClient = () => {
  const env = getSupabaseEnvOptional();
  if (!env) return null;

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
