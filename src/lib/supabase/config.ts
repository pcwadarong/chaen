type SupabaseEnv = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

const readSupabaseEnv = () => ({
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

/**
 * Supabase 공개 환경변수가 모두 설정되어 있는지 확인합니다.
 */
export const hasSupabaseEnv = (): boolean => {
  const { supabaseAnonKey, supabaseUrl } = readSupabaseEnv();

  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Supabase 클라이언트 생성용 환경변수를 optional하게 읽어옵니다.
 */
export const getSupabaseEnvOptional = (): SupabaseEnv | null => {
  const { supabaseAnonKey, supabaseUrl } = readSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return {
    supabaseAnonKey,
    supabaseUrl,
  };
};

/**
 * Supabase 클라이언트 생성에 필요한 환경 변수를 안전하게 읽어옵니다.
 */
export const getSupabaseEnv = (): SupabaseEnv => {
  const env = getSupabaseEnvOptional();

  if (!env?.supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!env.supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
  };
};
