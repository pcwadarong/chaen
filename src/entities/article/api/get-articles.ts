import { unstable_cache } from 'next/cache';

import { getCanonicalTagSlug } from '@/entities/project/model/tag-map';
import { getRelatedEntityIdsByTagId, getTagIdBySlug } from '@/entities/tag/api/query-tags';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  buildCreatedAtIdPage,
  parseCreatedAtIdCursor,
  parseKeysetLimit,
} from '@/shared/lib/pagination/keyset-pagination';
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
  tag?: string | null;
};

type ArticleSearchCursor = {
  createdAt: string;
  id: string;
  rank: number;
};

type ArticleSearchRow = ArticleListItem & {
  content: string | null;
  search_rank: number;
  total_count: number;
};

/**
 * 아티클 검색어를 RPC 전달용으로 정규화합니다.
 *
 * 캐시 키와 RPC 파라미터가 같은 문자열을 바라보도록 trim만 수행합니다.
 */
const normalizeSearchQuery = (query?: string | null) => query?.trim() ?? '';

/**
 * 태그 필터를 목록 조회용으로 정규화합니다.
 */
const normalizeArticleTag = (tag?: string | null) =>
  tag?.trim() ? getCanonicalTagSlug(tag.trim()) : '';

/**
 * 검색 결과용 rank + created_at + id cursor를 URL에 안전한 문자열로 직렬화합니다.
 */
const serializeArticleSearchCursor = ({ createdAt, id, rank }: ArticleSearchCursor): string =>
  Buffer.from(JSON.stringify({ createdAt, id, rank }), 'utf-8').toString('base64url');

/**
 * 검색 결과용 keyset cursor를 rank + created_at + id 조합으로 복원합니다.
 */
const parseArticleSearchCursor = (cursor?: string | null): ArticleSearchCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<ArticleSearchCursor>;

    if (
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.rank !== 'number'
    ) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
      rank: parsed.rank,
    };
  } catch {
    return null;
  }
};

/**
 * created_at + id keyset 페이지 결과를 아티클 목록 응답 shape로 변환합니다.
 */
const toArticlesPage = (rows: ArticleListItem[], pageSize: number): ArticlesPage => {
  const page = buildCreatedAtIdPage({
    limit: pageSize,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  });

  return {
    items: dedupeById(
      page.items.map(({ createdAt: _createdAt, ...item }) => item as ArticleListItem),
    ),
    nextCursor: page.nextCursor,
    totalCount: null,
  };
};

/**
 * 내림차순 created_at + id 정렬 기준 keyset 조건을 쿼리에 적용합니다.
 */
const applyArticlesKeysetCursor = <
  T extends {
    order: (column: string, options: { ascending: boolean }) => T;
    or: (filters: string) => T;
  },
>(
  query: T,
  cursor?: string | null,
) => {
  const parsedCursor = parseCreatedAtIdCursor(cursor);
  const orderedQuery = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (!parsedCursor) return orderedQuery;

  return orderedQuery.or(
    `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},id.lt.${parsedCursor.id})`,
  );
};

/**
 * locale 컬럼을 사용하는 아티클 목록 페이지 조회입니다.
 *
 * 비검색 목록에서는 기존 locale fallback 정책을 유지해야 하므로
 * RPC 대신 일반 select 쿼리를 사용합니다.
 */
const fetchArticlesByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticlesPage; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      localeColumnMissing: false,
    };
  }

  const query = applyArticlesKeysetCursor(
    supabase
      .from('articles')
      .select('id,title,description,thumbnail_url,created_at')
      .eq('locale', locale),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

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
    data: toArticlesPage((data ?? []) as ArticleListItem[], pageSize),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 아티클 목록 페이지 조회입니다.
 *
 * 이전 스키마 호환성을 깨지 않기 위한 fallback 경로입니다.
 */
const fetchArticlesLegacy = async (
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const query = applyArticlesKeysetCursor(
    supabase.from('articles').select('id,title,description,thumbnail_url,created_at'),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    throw new Error(`[articles] 목록 조회 실패: ${error.message}`);
  }

  return toArticlesPage((data ?? []) as ArticleListItem[], pageSize);
};

/**
 * locale 컬럼을 사용하는 태그 필터 목록 조회입니다.
 *
 * 태그 필터는 현재 locale 범위에서만 동작하며 검색처럼 fallback을 사용하지 않습니다.
 */
const fetchArticlesByTagAndLocale = async (
  locale: string,
  tag: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticlesPage; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      localeColumnMissing: false,
    };
  }

  const resolvedTagId = await getTagIdBySlug(tag);
  if (resolvedTagId.schemaMissing) {
    return {
      data: await fetchArticlesByTagLegacy(tag, cursor, pageSize),
      localeColumnMissing: false,
    };
  }

  if (!resolvedTagId.data) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      localeColumnMissing: false,
    };
  }

  const relatedArticleIds = await getRelatedEntityIdsByTagId({
    entityColumn: 'article_id',
    locale,
    relationTable: 'article_tags',
    tagId: resolvedTagId.data,
  });

  if (relatedArticleIds.schemaMissing) {
    return {
      data: await fetchArticlesByTagLegacy(tag, cursor, pageSize),
      localeColumnMissing: false,
    };
  }

  if (relatedArticleIds.data.length === 0) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      localeColumnMissing: false,
    };
  }

  const query = applyArticlesKeysetCursor(
    supabase
      .from('articles')
      .select('id,title,description,thumbnail_url,created_at')
      .eq('locale', locale)
      .in('id', relatedArticleIds.data),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: { items: [], nextCursor: null, totalCount: null },
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] 태그 목록 조회 실패: ${error.message}`);
  }

  return {
    data: toArticlesPage((data ?? []) as ArticleListItem[], pageSize),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 스키마를 위한 태그 필터 fallback 조회입니다.
 */
const fetchArticlesByTagLegacy = async (
  tag: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const query = applyArticlesKeysetCursor(
    supabase
      .from('articles')
      .select('id,title,description,thumbnail_url,created_at')
      .contains('tags', [tag]),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    throw new Error(`[articles] 레거시 태그 목록 조회 실패: ${error.message}`);
  }

  return toArticlesPage((data ?? []) as ArticleListItem[], pageSize);
};

/**
 * RPC 검색 결과를 rank + created_at + id keyset 페이지 형태로 변환합니다.
 *
 * RPC는 각 행마다 동일한 `total_count`를 포함하므로 첫 행의 메타데이터를 사용합니다.
 */
const toSearchArticlesPage = (rows: ArticleSearchRow[], pageSize: number): ArticlesPage => {
  const totalCount = rows[0]?.total_count ?? 0;
  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize);
  const lastItem = items.at(-1);

  return {
    items: items.map(
      ({ content: _content, search_rank: _rank, total_count: _totalCount, ...article }) => article,
    ),
    nextCursor:
      hasMore && lastItem
        ? serializeArticleSearchCursor({
            createdAt: lastItem.created_at,
            id: lastItem.id,
            rank: lastItem.search_rank,
          })
        : null,
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
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const parsedCursor = parseArticleSearchCursor(cursor);
  const { data, error } = await supabase.rpc('search_articles', {
    cursor_created_at: parsedCursor?.createdAt ?? null,
    cursor_id: parsedCursor?.id ?? null,
    cursor_rank: parsedCursor?.rank ?? null,
    page_limit: pageSize,
    search_query: query,
    target_locale: locale,
  });

  if (error) {
    throw new Error(`[articles] RPC 검색 조회 실패: ${error.message}`);
  }

  return toSearchArticlesPage((data ?? []) as ArticleSearchRow[], pageSize);
};

/**
 * 아티클 목록을 keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - 비검색 목록은 `created_at + id` 기준 keyset pagination을 사용합니다.
 * - 검색 목록은 `rank + created_at + id` 기준 keyset pagination을 사용합니다.
 * - locale 우선 조회 후, 비검색 첫 페이지에서만 `ko` fallback을 시도합니다.
 * - locale 컬럼 미존재 스키마에서는 legacy 조회로 자동 전환합니다.
 * - 반환 shape는 검색 여부와 상관없이 `items/nextCursor/totalCount`로 고정합니다.
 */
export const getArticles = async ({
  cursor,
  limit,
  locale,
  query,
  tag,
}: GetArticlesOptions): Promise<ArticlesPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') {
    return { items: [], nextCursor: null, totalCount: null };
  }

  const normalizedLocale = locale.toLowerCase();
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedTag = normalizedQuery ? '' : normalizeArticleTag(tag);
  const pageSize = parseKeysetLimit(limit);
  const parsedCursor = normalizedQuery
    ? parseArticleSearchCursor(cursor)
    : parseCreatedAtIdCursor(cursor);
  const cacheCursor = parsedCursor ? JSON.stringify(parsedCursor) : 'initial';

  const getCachedArticles = unstable_cache(
    async () => {
      if (normalizedQuery) {
        return fetchSearchArticles(normalizedQuery, normalizedLocale, cursor, pageSize);
      }

      if (normalizedTag) {
        const taggedResult = await fetchArticlesByTagAndLocale(
          normalizedLocale,
          normalizedTag,
          cursor,
          pageSize,
        );

        if (taggedResult.localeColumnMissing) {
          return fetchArticlesByTagLegacy(normalizedTag, cursor, pageSize);
        }

        return taggedResult.data;
      }

      const isFirstPage = !parsedCursor;

      if (!isFirstPage) {
        const localizedResult = await fetchArticlesByLocale(normalizedLocale, cursor, pageSize);
        if (localizedResult.localeColumnMissing) {
          return fetchArticlesLegacy(cursor, pageSize);
        }

        return localizedResult.data;
      }

      return resolveLocaleAwareData<ArticlesPage>({
        emptyData: { items: [], nextCursor: null, totalCount: null },
        fallbackLocale: 'ko',
        fetchByLocale: targetLocale => fetchArticlesByLocale(targetLocale, cursor, pageSize),
        fetchLegacy: () => fetchArticlesLegacy(cursor, pageSize),
        isEmptyData: page => page.items.length === 0,
        targetLocale: normalizedLocale,
      });
    },
    [
      'articles',
      'list',
      cacheScope,
      normalizedLocale,
      cacheCursor,
      String(pageSize),
      normalizedQuery,
      normalizedTag,
    ],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedArticles();
};
