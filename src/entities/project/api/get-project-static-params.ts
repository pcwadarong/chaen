import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type ProjectStaticParamRow = {
  slug: string | null;
};

/**
 * 공개 프로젝트 상세 경로를 정적으로 생성하기 위한 slug 목록을 가져옵니다.
 *
 * `generateStaticParams()`에서는 locale 상위 세그먼트와 조합할 child params만 필요하므로 현재 공개 상태이면서 게시 시점이 지난 프로젝트의 slug만 반환합니다.
 */
export const getProjectStaticParams = async (): Promise<Array<{ id: string }>> => {
  if (!hasSupabaseEnv()) return [];

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('visibility', 'public')
    .lte('publish_at', new Date().toISOString())
    .not('publish_at', 'is', null)
    .not('slug', 'is', null)
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
    })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`[projects] 정적 params slug 조회 실패: ${error.message}`);
  }

  return ((data ?? []) as ProjectStaticParamRow[])
    .map(row => row.slug?.trim() || null)
    .filter((slug): slug is string => Boolean(slug))
    .map(id => ({ id }));
};
