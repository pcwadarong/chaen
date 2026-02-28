type SupabaseEnv = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

/**
 * Supabase 클라이언트 생성에 필요한 환경 변수를 안전하게 읽어옵니다.
 */
export const getSupabaseEnv = (): SupabaseEnv => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
};
