import { createClient } from '@supabase/supabase-js';

import 'server-only';

type SupabaseServiceRoleEnv = {
  serviceRoleKey: string;
  supabaseUrl: string;
};

const readServiceRoleEnv = () => ({
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

/**
 * Service Role 클라이언트 생성에 필요한 환경변수를 optional하게 읽습니다.
 */
export const getSupabaseServiceRoleEnvOptional = (): SupabaseServiceRoleEnv | null => {
  const { serviceRoleKey, supabaseUrl } = readServiceRoleEnv();
  if (!serviceRoleKey || !supabaseUrl) return null;

  return {
    serviceRoleKey,
    supabaseUrl,
  };
};

/**
 * Service Role 클라이언트 생성에 필요한 환경변수를 강제 검증합니다.
 */
export const getSupabaseServiceRoleEnv = (): SupabaseServiceRoleEnv => {
  const env = getSupabaseServiceRoleEnvOptional();
  if (!env?.supabaseUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');

  if (!env.serviceRoleKey)
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');

  return env;
};

/**
 * 서버에서 쓰기/관리 작업을 수행하는 Service Role Supabase 클라이언트를 생성합니다.
 */
export const createServiceRoleSupabaseClient = () => {
  const { serviceRoleKey, supabaseUrl } = getSupabaseServiceRoleEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * 환경변수가 있을 때만 Service Role Supabase 클라이언트를 생성합니다.
 */
export const createOptionalServiceRoleSupabaseClient = () => {
  const env = getSupabaseServiceRoleEnvOptional();
  if (!env) return null;

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
