import { incrementTableViewCount } from '@/shared/lib/supabase/increment-table-view-count';

import 'server-only';

/**
 * 아티클 조회수를 1 증가시킵니다.
 */
export const incrementArticleViewCount = async (articleId: string): Promise<number> =>
  incrementTableViewCount({
    id: articleId,
    tableName: 'articles',
  });
