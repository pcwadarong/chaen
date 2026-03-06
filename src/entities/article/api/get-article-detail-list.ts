import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleDetailListItem } from '../model/types';

const DETAIL_LIST_LIMIT = 200;

/**
 * 아티클 상세 아카이브용 요약 목록을 정규화합니다.
 */
const toArticleDetailListItems = (rows: ArticleDetailListItem[]): ArticleDetailListItem[] =>
  rows.map(({ created_at, description, id, title }) => ({
    created_at,
    description,
    id,
    title,
  }));

/**
 * locale 컬럼을 사용하는 아티클 요약 목록을 조회합니다.
 */
const fetchArticleDetailListByLocale = async (
  locale: string,
): Promise<{ data: ArticleDetailListItem[]; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      localeColumnMissing: false,
    };
  }

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,created_at')
    .eq('locale', locale)
    .order('created_at', { ascending: false })
    .range(0, DETAIL_LIST_LIMIT - 1);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] 상세 목록 조회 실패: ${error.message}`);
  }

  return {
    data: toArticleDetailListItems((data ?? []) as ArticleDetailListItem[]),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 아티클 요약 목록을 조회합니다.
 */
const fetchArticleDetailListLegacy = async (): Promise<ArticleDetailListItem[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,created_at')
    .order('created_at', { ascending: false })
    .range(0, DETAIL_LIST_LIMIT - 1);

  if (error) {
    throw new Error(`[articles] 상세 목록 legacy 조회 실패: ${error.message}`);
  }

  return toArticleDetailListItems((data ?? []) as ArticleDetailListItem[]);
};

/**
 * 아티클 상세 좌측 아카이브 목록을 가져옵니다.
 */
export const getArticleDetailList = async (locale: string): Promise<ArticleDetailListItem[]> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return [];

  const normalizedLocale = locale.toLowerCase();
  const getCachedArticleDetailList = unstable_cache(
    async () =>
      resolveLocaleAwareData<ArticleDetailListItem[]>({
        emptyData: [],
        fallbackLocale: 'ko',
        fetchByLocale: targetLocale => fetchArticleDetailListByLocale(targetLocale),
        fetchLegacy: fetchArticleDetailListLegacy,
        isEmptyData: items => items.length === 0,
        targetLocale: normalizedLocale,
      }),
    ['articles', 'detail-list', cacheScope, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticleDetailList();
};
