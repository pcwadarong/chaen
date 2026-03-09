import { unstable_cache } from 'next/cache';

import { buildCreatedAtIdPage } from '@/shared/lib/pagination/keyset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleDetailListItem } from '../model/types';

import { type ArticleTranslationRow, mapArticleDetailListItems } from './map-article-translation';

const DETAIL_LIST_LIMIT = 200;

const isMissingArticleShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('articles') || normalizedMessage.includes('article_translations')
  );
};

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
 * content schema(`articles` + `article_translations`) 기준 상세 아카이브 목록을 조회합니다.
 */
const fetchArticleDetailListFromShadow = async (
  locale: string,
): Promise<{ data: ArticleDetailListItem[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data: translationRows, error: translationError } = await supabase
    .from('article_translations')
    .select('article_id,title,description,articles!inner(created_at)')
    .eq('locale', locale)
    .order('created_at', { ascending: false, referencedTable: 'articles' })
    .order('article_id', { ascending: false })
    .limit(DETAIL_LIST_LIMIT + 1);

  if (translationError) {
    if (isMissingArticleShadowSchemaError(translationError.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[articles] 상세 목록 번역 조회 실패: ${translationError.message}`);
  }

  return {
    data: toArticleDetailListItems(
      mapArticleDetailListItems((translationRows ?? []) as ArticleTranslationRow[]),
    ),
    schemaMissing: false,
  };
};

const fetchArticleDetailListByLocale = async (locale: string): Promise<ArticleDetailListItem[]> => {
  const articleDetailList = await fetchArticleDetailListFromShadow(locale);
  if (articleDetailList.schemaMissing) {
    throw new Error('[articles] content schema가 없습니다.');
  }

  return articleDetailList.data;
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
    async () => {
      const localizedItems = await fetchArticleDetailListByLocale(normalizedLocale);
      if (localizedItems.length > 0 || normalizedLocale === 'ko') return localizedItems;

      return fetchArticleDetailListByLocale('ko');
    },
    ['articles', 'detail-list', cacheScope, normalizedLocale, 'keyset'],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticleDetailList();
};
