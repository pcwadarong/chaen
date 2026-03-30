import { createClient } from '@supabase/supabase-js';

import { getSupabaseEnv, getSupabaseEnvOptional } from '@/shared/lib/supabase/config';

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

// undefined: 미초기화, null: env 없음
let _optionalClientInstance: ReturnType<typeof createClient> | null | undefined = undefined;

/**
 * 서버리스 인스턴스 내에서 Supabase 클라이언트를 재사용합니다.
 *
 * `createOptionalPublicServerSupabaseClient()`는 호출마다 새 인스턴스를 만들어
 * 같은 요청에서도 HTTP 연결을 공유하지 못합니다.
 * 이 함수는 모듈 초기화 시 한 번만 인스턴스를 생성하고 이후 호출에서는 같은 객체를 반환합니다.
 *
 * 단순 read 전용 entity 함수(get-article, get-project 등)에서 사용합니다.
 */
export const getOptionalPublicServerSupabaseClient = () => {
  if (_optionalClientInstance !== undefined) return _optionalClientInstance;

  const env = getSupabaseEnvOptional();

  if (!env) {
    _optionalClientInstance = null;
    return null;
  }

  _optionalClientInstance = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _optionalClientInstance;
};
