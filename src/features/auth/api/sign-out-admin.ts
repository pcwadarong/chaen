import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client';

/**
 * 관리자 세션을 종료하고 Supabase auth 쿠키를 정리합니다.
 */
export const signOutAdmin = async (): Promise<void> => {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error('sign out failed');
  }
};
