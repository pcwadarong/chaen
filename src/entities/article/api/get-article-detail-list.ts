import { unstable_cache } from 'next/cache';

import { buildCreatedAtIdPage } from '@/shared/lib/pagination/keyset-pagination';
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
 * 아티클 상세 아카이브용 요약 목록을 keyset 정렬 기준으로 정규화합니다.
 */
const toArticleDetailListItems = (rows: ArticleDetailListItem[]): ArticleDetailListItem[] =>
  buildCreatedAtIdPage({
    limit: DETAIL_LIST_LIMIT,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  }).items.map(({ createdAt: _createdAt, ...row }) => ({
    created_at: row.created_at,
    description: row.description,
    id: row.id,
    title: row.title,
  }));

/**
 * keyset 정렬 기준으로 아티클 요약 목록 쿼리를 구성합니다.
 */
const createArticleDetailListQuery = (locale?: string) => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const baseQuery = supabase
    .from('articles')
    .select('id,title,description,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  return locale ? baseQuery.eq('locale', locale) : baseQuery;
};

/**
 * locale 컬럼을 사용하는 아티클 요약 목록을 조회합니다.
 */
const fetchArticleDetailListByLocale = async (
  locale: string,
): Promise<{ data: ArticleDetailListItem[]; localeColumnMissing: boolean }> => {
  const query = createArticleDetailListQuery(locale);
  if (!query) {
    return {
      data: [],
      localeColumnMissing: false,
    };
  }

  const { data, error } = await query.limit(DETAIL_LIST_LIMIT + 1);

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
  const query = createArticleDetailListQuery();
  if (!query) return [];

  const { data, error } = await query.limit(DETAIL_LIST_LIMIT + 1);

  if (error) {
    throw new Error(`[articles] 상세 목록 legacy 조회 실패: ${error.message}`);
  }

  return toArticleDetailListItems((data ?? []) as ArticleDetailListItem[]);
};

/**
 * 아티클 상세 좌측 아카이브 목록을 가져옵니다.
 *
 * 현재 UI는 첫 페이지만 사용하지만, 조회 자체는 keyset 정렬 기준으로 통일합니다.
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
    ['articles', 'detail-list', cacheScope, normalizedLocale, 'keyset'],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticleDetailList();
};
