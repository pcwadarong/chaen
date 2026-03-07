import { unstable_cache } from 'next/cache';

import { getRelatedEntityIdsByTagId, getTagIdBySlug } from '@/entities/tag/api/query-tags';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  buildCreatedAtIdPage,
  parseCreatedAtIdCursor,
  parseKeysetLimit,
} from '@/shared/lib/pagination/keyset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { CONTENT_SHADOW_SCHEMA } from '@/shared/lib/supabase/content-shadow-schema';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleListItem } from '../model/types';

const isMissingArticlesShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.articles) ||
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.articleTranslations)
  );
};

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
  search_rank: number;
  total_count: number;
};

type ArticleTranslationListRow = Pick<ArticleListItem, 'description' | 'title'> & {
  article_id: string;
};

type ArticleTranslationWithBaseRow = ArticleTranslationListRow & {
  articles: Pick<ArticleListItem, 'created_at' | 'thumbnail_url'>[] | null;
};

/**
 * 아티클 검색어를 RPC 전달용으로 정규화합니다.
 *
 * 캐시 키와 RPC 파라미터가 같은 문자열을 바라보도록 trim만 수행합니다.
 */
const normalizeSearchQuery = (query?: string | null) => query?.trim() ?? '';

/**
 * 태그 필터를 slug 기준으로 정규화합니다.
 */
const normalizeArticleTag = (tag?: string | null) => (tag?.trim() ? tag.trim().toLowerCase() : '');

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
 * content schema(`articles` + `article_translations`) 결과를 목록 아이템으로 조합합니다.
 */
const mapShadowArticleListItems = (
  translationRows: ArticleTranslationWithBaseRow[],
): ArticleListItem[] =>
  translationRows.flatMap(row => {
    const article = row.articles?.[0];
    if (!article) return [];

    return [
      {
        created_at: article.created_at,
        description: row.description,
        id: row.article_id,
        thumbnail_url: article.thumbnail_url,
        title: row.title,
      } satisfies ArticleListItem,
    ];
  });

/**
 * content schema(`articles` + `article_translations`)에서 locale별 기본 목록을 조회합니다.
 */
const fetchArticlesByLocaleFromShadow = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticlesPage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      schemaMissing: false,
    };
  }

  const parsedCursor = parseCreatedAtIdCursor(cursor);
  let translationsQuery = supabase
    .from(CONTENT_SHADOW_SCHEMA.articleTranslations)
    .select('article_id,title,description,articles!inner(created_at,thumbnail_url)')
    .eq('locale', locale)
    .order('created_at', { ascending: false, referencedTable: 'articles' })
    .order('article_id', { ascending: false });

  if (parsedCursor) {
    translationsQuery = translationsQuery.or(
      `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},article_id.lt.${parsedCursor.id})`,
      { referencedTable: 'articles' },
    );
  }

  const { data: translationRows, error: translationsError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationsError) {
    if (isMissingArticlesShadowSchemaError(translationsError.message)) {
      return {
        data: { items: [], nextCursor: null, totalCount: null },
        schemaMissing: true,
      };
    }

    throw new Error(`[articles] shadow 번역 목록 조회 실패: ${translationsError.message}`);
  }

  return {
    data: toArticlesPage(
      mapShadowArticleListItems((translationRows ?? []) as ArticleTranslationWithBaseRow[]),
      pageSize,
    ),
    schemaMissing: false,
  };
};

const fetchArticlesByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticlesPage> => {
  const shadowArticles = await fetchArticlesByLocaleFromShadow(locale, cursor, pageSize);
  if (shadowArticles.schemaMissing) {
    throw new Error('[articles] shadow content schema가 없습니다.');
  }

  return shadowArticles.data;
};

/**
 * canonical tag relation을 기준으로 현재 locale 번역 목록을 조회합니다.
 *
 * 태그 필터는 검색 RPC를 거치지 않고, relation 조회 후 content 목록을 조합합니다.
 */
const fetchArticlesByTagAndLocale = async (
  locale: string,
  tag: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticlesPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return { items: [], nextCursor: null, totalCount: null };
  }

  const resolvedTagId = await getTagIdBySlug(tag);
  if (resolvedTagId.schemaMissing) {
    throw new Error('[articles] 태그 schema가 없습니다.');
  }

  if (!resolvedTagId.data) {
    return { items: [], nextCursor: null, totalCount: null };
  }

  const shadowArticleIds = await getRelatedEntityIdsByTagId({
    entityColumn: 'article_id',
    relationTable: CONTENT_SHADOW_SCHEMA.articleTags,
    tagId: resolvedTagId.data,
  });
  if (shadowArticleIds.schemaMissing) {
    throw new Error('[articles] 태그 relation schema가 없습니다.');
  }

  if (shadowArticleIds.data.length === 0) {
    return { items: [], nextCursor: null, totalCount: null };
  }

  const parsedCursor = parseCreatedAtIdCursor(cursor);
  let translationsQuery = supabase
    .from(CONTENT_SHADOW_SCHEMA.articleTranslations)
    .select('article_id,title,description,articles!inner(created_at,thumbnail_url)')
    .eq('locale', locale)
    .in('article_id', shadowArticleIds.data)
    .order('created_at', { ascending: false, referencedTable: 'articles' })
    .order('article_id', { ascending: false });

  if (parsedCursor) {
    translationsQuery = translationsQuery.or(
      `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},article_id.lt.${parsedCursor.id})`,
      { referencedTable: 'articles' },
    );
  }

  const { data: translationRows, error: translationsError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationsError) {
    if (isMissingArticlesShadowSchemaError(translationsError.message)) {
      throw new Error('[articles] shadow content schema가 없습니다.');
    }

    throw new Error(`[articles] shadow 태그 목록 조회 실패: ${translationsError.message}`);
  }

  return toArticlesPage(
    mapShadowArticleListItems((translationRows ?? []) as ArticleTranslationWithBaseRow[]),
    pageSize,
  );
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
    items: items.map(({ search_rank: _rank, total_count: _totalCount, ...article }) => article),
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
 * `article_translations` 기반 `search_article_translations` RPC로 아티클을 검색합니다.
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
  const { data, error } = await supabase.rpc(CONTENT_SHADOW_SCHEMA.articleSearchRpc, {
    cursor_created_at: parsedCursor?.createdAt ?? null,
    cursor_id: parsedCursor?.id ?? null,
    cursor_rank: parsedCursor?.rank ?? null,
    page_limit: pageSize,
    search_query: query,
    target_locale: locale,
  });

  if (error) {
    throw new Error(`[articles] shadow RPC 검색 조회 실패: ${error.message}`);
  }

  return toSearchArticlesPage((data ?? []) as ArticleSearchRow[], pageSize);
};

/**
 * 아티클 목록을 keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - 비검색 목록은 `created_at + id` 기준 keyset pagination을 사용합니다.
 * - 검색 목록은 `rank + created_at + id` 기준 keyset pagination을 사용합니다.
 * - locale 우선 조회 후, 비검색 첫 페이지에서만 번역 fallback으로 `ko`를 한 번 더 조회합니다.
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
        return fetchArticlesByTagAndLocale(normalizedLocale, normalizedTag, cursor, pageSize);
      }

      const isFirstPage = !parsedCursor;

      if (!isFirstPage) {
        return fetchArticlesByLocale(normalizedLocale, cursor, pageSize);
      }

      const localizedArticles = await fetchArticlesByLocale(normalizedLocale, cursor, pageSize);
      if (localizedArticles.items.length > 0 || normalizedLocale === 'ko') {
        return localizedArticles;
      }

      return fetchArticlesByLocale('ko', cursor, pageSize);
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
