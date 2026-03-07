import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type IncrementTableViewCountInput = {
  id: string;
};

/**
 * 지정한 테이블 레코드의 조회수를 1 증가시키고 최신 값을 반환합니다.
 */
export const incrementTableViewCount = async ({
  id,
}: IncrementTableViewCountInput): Promise<number> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('service role env is not configured');

  const { data, error } = await supabase.rpc('increment_article_view_count', {
    target_id: id,
  });

  if (error) throw new Error(`조회수 증가 실패: ${error.message}`);
  if (data === null || typeof data === 'undefined') throw new Error('articles item not found');

  return Number(data);
};
