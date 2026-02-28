import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseEnv } from '@/lib/supabase/config';

/**
 * 미들웨어에서 세션을 갱신하고 응답 쿠키를 동기화합니다.
 */
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request,
  });

  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
};
