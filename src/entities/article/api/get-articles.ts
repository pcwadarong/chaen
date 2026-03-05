import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { Article } from '../model/types';

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
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: dedupeById((data ?? []) as Article[]),
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

  return dedupeById((data ?? []) as Article[]);
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
    async () =>
      resolveLocaleAwareData<Article[]>({
        emptyData: [],
        fetchByLocale: fetchArticlesByLocale,
        fetchLegacy: fetchArticlesLegacy,
        isEmptyData: items => items.length === 0,
        targetLocale: normalizedLocale,
      }),
    ['articles', 'list', cacheScope, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticles();
};
