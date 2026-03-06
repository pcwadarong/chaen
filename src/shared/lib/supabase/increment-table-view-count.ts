import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type IncrementTableViewCountInput = {
  id: string;
  tableName: 'articles' | 'projects';
};

/**
 * 지정한 테이블 레코드의 조회수를 1 증가시키고 최신 값을 반환합니다.
 */
export const incrementTableViewCount = async ({
  id,
  tableName,
}: IncrementTableViewCountInput): Promise<number> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('service role env is not configured');

  const { data: current, error: currentError } = await supabase
    .from(tableName)
    .select('view_count')
    .eq('id', id)
    .maybeSingle<{ view_count?: number | null }>();

  if (currentError) {
    throw new Error(`[${tableName}] 조회수 현재값 조회 실패: ${currentError.message}`);
  }

  if (!current) {
    throw new Error(`${tableName} item not found`);
  }

  const nextViewCount = Number(current.view_count ?? 0) + 1;
  const { data, error } = await supabase
    .from(tableName)
    .update({
      view_count: nextViewCount,
    })
    .eq('id', id)
    .select('view_count')
    .maybeSingle<{ view_count?: number | null }>();

  if (error) {
    throw new Error(`[${tableName}] 조회수 증가 실패: ${error.message}`);
  }

  return Number(data?.view_count ?? nextViewCount);
};
