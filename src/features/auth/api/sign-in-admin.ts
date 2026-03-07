'use client';

import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client';

type SignInAdminInput = {
  email: string;
  password: string;
};

/**
 * 관리자 로그인 폼에서 이메일/비밀번호 기반 Supabase 세션을 생성합니다.
 */
export const signInAdmin = async ({ email, password }: SignInAdminInput): Promise<void> => {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('invalid credentials');
    }

    throw new Error('sign in failed');
  }

  if (!session) {
    throw new Error('sign in failed');
  }
};
