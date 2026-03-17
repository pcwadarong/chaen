import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

type ProjectStaticSeedParam = {
  id: string;
};

/**
 * 프로젝트 상세의 first-hit static 검증용 대표 slug를 최소 개수만 반환합니다.
 */
export const getProjectStaticSeedParams = async (): Promise<ProjectStaticSeedParam[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];
  const nowIsoString = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('visibility', 'public')
    .not('slug', 'is', null)
    .not('publish_at', 'is', null)
    .lte('publish_at', nowIsoString)
    .order('publish_at', { ascending: false })
    .limit(1);

  if (error) return [];

  return (data ?? [])
    .map(item => item.slug?.trim() ?? '')
    .filter(Boolean)
    .map(id => ({ id }));
};
