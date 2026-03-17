import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

type ArticleStaticSeedParam = {
  id: string;
};

/**
 * 아티클 상세의 first-hit static 검증용 대표 slug를 최소 개수만 반환합니다.
 */
export const getArticleStaticSeedParams = async (): Promise<ArticleStaticSeedParam[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];
  const nowIsoString = new Date().toISOString();

  const { data, error } = await supabase
    .from('articles')
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
