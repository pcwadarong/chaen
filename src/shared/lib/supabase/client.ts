'use client';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnv } from '@/shared/lib/supabase/config';

/**
 * 브라우저 환경에서 Supabase Authentication 요청에 사용하는 클라이언트를 생성합니다.
 */
export const createBrowserSupabaseClient = () => {
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
