import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { Article } from '../model/types';

/**
 * 같은 id가 중복된 경우(created_at 역순 기준) 첫 레코드만 유지합니다.
 */
const dedupeArticlesById = (items: Article[]): Article[] => {
  const seen = new Set<string>();
  const deduped: Article[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
};

/**
 * locale 컬럼을 사용하는 아티클 목록 조회입니다.
 */
const fetchArticlesByLocale = async (
  locale: string,
): Promise<{ data: Article[]; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], localeColumnMissing: false };

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('locale', locale)
    .order('created_at', { ascending: false });

  if (error) {
    const isLocaleColumnMissing = /column .*locale.* does not exist/i.test(error.message);
    if (isLocaleColumnMissing) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: dedupeArticlesById((data ?? []) as Article[]),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 아티클 목록 조회입니다.
 */
const fetchArticlesLegacy = async (): Promise<Article[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`[articles] 목록 조회 실패: ${error.message}`);
  }

  return dedupeArticlesById((data ?? []) as Article[]);
};

/**
 * 아티클 목록 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('articles')`로 즉시 갱신할 수 있습니다.
 */
export const getArticles = async (targetLocale: string): Promise<Article[]> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return [];

  const normalizedLocale = targetLocale.toLowerCase();
  const getCachedArticles = unstable_cache(
    async () => {
      const localizedResult = await fetchArticlesByLocale(normalizedLocale);
      if (localizedResult.localeColumnMissing) return fetchArticlesLegacy();

      if (localizedResult.data.length > 0) return localizedResult.data;

      if (normalizedLocale !== 'en') {
        const fallbackResult = await fetchArticlesByLocale('en');
        if (fallbackResult.localeColumnMissing) return fetchArticlesLegacy();

        if (fallbackResult.data.length > 0) return fallbackResult.data;
      }

      return [];
    },
    ['articles', 'list', cacheScope, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticles();
};
