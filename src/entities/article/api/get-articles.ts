import { unstable_cache } from 'next/cache';

import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  buildOffsetPage,
  parseOffsetCursor,
  parseOffsetLimit,
} from '@/shared/lib/pagination/offset-pagination';
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
};

type GetArticlesOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
  query?: string | null;
};

const SEARCH_CANDIDATE_LIMIT = 200;

/**
 * 아티클 검색어를 소문자 비교용으로 정규화합니다.
 */
const normalizeSearchQuery = (query?: string | null) => query?.trim().toLowerCase() ?? '';

/**
 * 아티클이 검색어를 제목/설명 기준으로 포함하는지 판단합니다.
 */
const matchesSearchQuery = (article: ArticleListItem, normalizedQuery: string) => {
  if (!normalizedQuery) return true;

  return [article.title, article.description ?? ''].some(text =>
    text.toLowerCase().includes(normalizedQuery),
  );
};

/**
 * 조회 결과 행으로부터 다음 페이지 cursor를 계산합니다.
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
  };
};

/**
 * locale 컬럼을 사용하는 아티클 목록 페이지 조회입니다.
 */
const fetchArticlesByLocale = async (
  locale: string,
  offset: number,
  pageSize: number,
): Promise<{ data: ArticlesPage; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null },
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
        data: { items: [], nextCursor: null },
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
 */
const fetchArticlesLegacy = async (offset: number, pageSize: number): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null };

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
 * 검색용 아티클 후보를 locale 기준 최신순으로 조회합니다.
 */
const fetchArticleSearchCandidatesByLocale = async (
  locale: string,
): Promise<{ data: ArticleListItem[]; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      localeColumnMissing: false,
    };
  }

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,thumbnail_url,created_at')
    .eq('locale', locale)
    .order('created_at', { ascending: false })
    .range(0, SEARCH_CANDIDATE_LIMIT - 1);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] 검색 후보 조회 실패: ${error.message}`);
  }

  return {
    data: dedupeById((data ?? []) as ArticleListItem[]),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마용 검색 후보를 조회합니다.
 */
const fetchArticleSearchCandidatesLegacy = async (): Promise<ArticleListItem[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,description,thumbnail_url,created_at')
    .order('created_at', { ascending: false })
    .range(0, SEARCH_CANDIDATE_LIMIT - 1);

  if (error) {
    throw new Error(`[articles] legacy 검색 후보 조회 실패: ${error.message}`);
  }

  return dedupeById((data ?? []) as ArticleListItem[]);
};

/**
 * 아티클 목록을 cursor(offset) 기반 페이지 단위로 조회합니다.
 *
 * - locale 우선 조회 후, 첫 페이지에서만 `ko` fallback을 시도합니다.
 * - locale 컬럼 미존재 스키마에서는 legacy 조회로 자동 전환합니다.
 */
export const getArticles = async ({
  cursor,
  limit,
  locale,
  query,
}: GetArticlesOptions): Promise<ArticlesPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const normalizedQuery = normalizeSearchQuery(query);
  const offset = parseOffsetCursor(cursor);
  const pageSize = parseOffsetLimit(limit);

  const getCachedArticles = unstable_cache(
    async () => {
      if (normalizedQuery) {
        const candidates = await resolveLocaleAwareData<ArticleListItem[]>({
          emptyData: [],
          fallbackLocale: 'ko',
          fetchByLocale: targetLocale => fetchArticleSearchCandidatesByLocale(targetLocale),
          fetchLegacy: fetchArticleSearchCandidatesLegacy,
          isEmptyData: items => items.length === 0,
          targetLocale: normalizedLocale,
        });

        const matchedItems = candidates.filter(article =>
          matchesSearchQuery(article, normalizedQuery),
        );

        return buildOffsetPage({
          cursor,
          items: matchedItems,
          limit: pageSize,
        });
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
        emptyData: { items: [], nextCursor: null },
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
