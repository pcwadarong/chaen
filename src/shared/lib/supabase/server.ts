import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabaseEnv } from '@/shared/lib/supabase/config';

/**
 * 서버 컴포넌트와 서버 액션에서 사용하는 Supabase 클라이언트를 생성합니다.
 */
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /**
           * 서버 컴포넌트에서는 cookie 쓰기가 제한될 수 있습니다.
           * 세션 갱신은 middleware 경계에서 처리합니다.
           */
        }
      },
    },
  });
};
