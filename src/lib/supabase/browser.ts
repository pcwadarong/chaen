import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnv } from '@/lib/supabase/config';

/**
 * 브라우저 환경에서 사용하는 Supabase 클라이언트를 생성합니다.
 */
export const createBrowserSupabaseClient = () => {
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
