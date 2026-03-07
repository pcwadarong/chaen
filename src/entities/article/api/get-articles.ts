import { unstable_cache } from 'next/cache';

import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { parseOffsetCursor, parseOffsetLimit } from '@/shared/lib/pagination/offset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleListItem } from '../model/types';

type ArticlesPage = {
  items: ArticleListItem[];
  nextCursor: string | null;
  totalCount: number | null;
};

type GetArticlesOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
  query?: string | null;
};

type ArticleSearchRow = ArticleListItem & {
  content: string | null;
  total_count: number;
};

/**
 * 아티클 검색어를 RPC 전달용으로 정규화합니다.
 *
 * 캐시 키와 RPC 파라미터가 같은 문자열을 바라보도록 trim만 수행합니다.
 */
const normalizeSearchQuery = (query?: string | null) => query?.trim() ?? '';

/**
 * 조회 결과 행으로부터 다음 페이지 cursor를 계산합니다.
 *
 * `range(offset, offset + pageSize)`로 한 행을 더 받아오는 기존 규칙을 유지해
 * 다음 페이지 존재 여부를 안정적으로 계산합니다.
 */
const toArticlesPage = (
  rows: ArticleListItem[],
  offset: number,
  pageSize: number,
): ArticlesPage => {
  const hasMore = rows.length > pageSize;
  const pageItems = dedupeById(rows.slice(0, pageSize));

  return {
    items: pageItems,
    nextCursor: hasMore ? String(offset + pageSize) : null,
    totalCount: null,
  };
};

/**
 * locale 컬럼을 사용하는 아티클 목록 페이지 조회입니다.
 *
 * 비검색 목록에서는 기존 locale fallback 정책을 유지해야 하므로
 * RPC 대신 일반 select 쿼리를 사용합니다.
 */
const fetchArticlesByLocale = async (
  locale: string,
  offset: number,
  pageSize: number,
): Promise<{ data: ArticlesPage; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      localeColumnMissing: false,
    };
  }

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,thumbnail_url,created_at')
    .eq('locale', locale)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: { items: [], nextCursor: null, totalCount: null },
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: toArticlesPage((data ?? []) as ArticleListItem[], offset, pageSize),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 아티클 목록 페이지 조회입니다.
 *
 * 이전 스키마 호환성을 깨지 않기 위한 fallback 경로입니다.
 */
const fetchArticlesLegacy = async (offset: number, pageSize: number): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,thumbnail_url,created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize);

  if (error) {
    throw new Error(`[articles] 목록 조회 실패: ${error.message}`);
  }

  return toArticlesPage((data ?? []) as ArticleListItem[], offset, pageSize);
};

/**
 * RPC 검색 결과를 cursor(offset) 기반 페이지 형태로 변환합니다.
 *
 * RPC는 각 행마다 동일한 `total_count`를 포함하므로 첫 행의 메타데이터를 사용합니다.
 */
const toSearchArticlesPage = (
  rows: ArticleSearchRow[],
  offset: number,
  pageSize: number,
): ArticlesPage => {
  const totalCount = rows[0]?.total_count ?? 0;

  return {
    items: rows.map(({ content: _content, total_count: _totalCount, ...article }) => article),
    nextCursor: offset + pageSize < totalCount ? String(offset + pageSize) : null,
    totalCount,
  };
};

/**
 * 검색어가 있을 때 Supabase RPC로 아티클을 조회합니다.
 *
 * 검색 경로에서는 locale fallback 없이 요청 locale만 서버로 전달합니다.
 */
const fetchSearchArticles = async (
  query: string,
  locale: string,
  offset: number,
  pageSize: number,
): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: 0 };

  const { data, error } = await supabase.rpc('search_articles', {
    page_limit: pageSize,
    page_offset: offset,
    search_query: query,
    target_locale: locale,
  });

  if (error) {
    throw new Error(`[articles] RPC 검색 조회 실패: ${error.message}`);
  }

  return toSearchArticlesPage((data ?? []) as ArticleSearchRow[], offset, pageSize);
};

/**
 * 아티클 목록을 cursor(offset) 기반 페이지 단위로 조회합니다.
 *
 * - locale 우선 조회 후, 첫 페이지에서만 `ko` fallback을 시도합니다.
 * - 검색 시에는 RPC를 사용하며 locale fallback을 적용하지 않습니다.
 * - locale 컬럼 미존재 스키마에서는 legacy 조회로 자동 전환합니다.
 * - 반환 shape는 검색 여부와 상관없이 `items/nextCursor/totalCount`로 고정합니다.
 */
export const getArticles = async ({
  cursor,
  limit,
  locale,
  query,
}: GetArticlesOptions): Promise<ArticlesPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') {
    return { items: [], nextCursor: null, totalCount: null };
  }

  const normalizedLocale = locale.toLowerCase();
  const normalizedQuery = normalizeSearchQuery(query);
  const offset = parseOffsetCursor(cursor);
  const pageSize = parseOffsetLimit(limit);

  const getCachedArticles = unstable_cache(
    async () => {
      if (normalizedQuery) {
        return fetchSearchArticles(normalizedQuery, normalizedLocale, offset, pageSize);
      }

      const isFirstPage = offset === 0;

      if (!isFirstPage) {
        const localizedResult = await fetchArticlesByLocale(normalizedLocale, offset, pageSize);
        if (localizedResult.localeColumnMissing) {
          return fetchArticlesLegacy(offset, pageSize);
        }

        return localizedResult.data;
      }

      return resolveLocaleAwareData<ArticlesPage>({
        emptyData: { items: [], nextCursor: null, totalCount: null },
        fallbackLocale: 'ko',
        fetchByLocale: targetLocale => fetchArticlesByLocale(targetLocale, offset, pageSize),
        fetchLegacy: () => fetchArticlesLegacy(offset, pageSize),
        isEmptyData: page => page.items.length === 0,
        targetLocale: normalizedLocale,
      });
    },
    [
      'articles',
      'list',
      cacheScope,
      normalizedLocale,
      String(offset),
      String(pageSize),
      normalizedQuery,
    ],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticles();
};
