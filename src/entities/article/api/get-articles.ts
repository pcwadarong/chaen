import { unstable_cacheTag as cacheTag } from 'next/cache';

import { getRelatedEntityIdsByTagId, getTagIdBySlug } from '@/entities/tag/api/query-tags';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { resolvePublicContentPublishedAt } from '@/shared/lib/content/public-content';
import {
  buildPublishedAtIdPage,
  parseKeysetLimit,
  parsePublishedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';
import { buildReferencedPublicContentFilter } from '@/shared/lib/supabase/build-public-content-filter';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleListItem, ArticleListPage } from '../model/types';

import { type ArticleTranslationRow, mapArticleListItems } from './map-article-translation';

const isMissingArticlesShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  const hasMissingRelationText =
    normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist');
  const hasTargetRelationName =
    normalizedMessage.includes('articles') || normalizedMessage.includes('article_translations');

  return hasMissingRelationText && hasTargetRelationName;
};

type GetArticlesOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
  query?: string | null;
  tag?: string | null;
};

type GetResolvedArticlesFirstPageOptions = Omit<GetArticlesOptions, 'cursor'>;

export type ResolvedArticleListPage = {
  page: ArticleListPage;
  resolvedLocale: string;
};

type ArticleSearchCursor = {
  id: string;
  publishedAt: string;
  rank: number;
};

type ArticleSearchRow = ArticleListItem & {
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
 * 태그 필터를 slug 기준으로 정규화합니다.
 */
const normalizeArticleTag = (tag?: string | null) => (tag?.trim() ? tag.trim().toLowerCase() : '');

/**
 * 검색 결과용 rank + publish_at + id cursor를 URL에 안전한 문자열로 직렬화합니다.
 */
const serializeArticleSearchCursor = ({ id, publishedAt, rank }: ArticleSearchCursor): string =>
  Buffer.from(JSON.stringify({ id, publishedAt, rank }), 'utf-8').toString('base64url');

/**
 * 검색 결과용 keyset cursor를 rank + publish_at + id 조합으로 복원합니다.
 */
const parseArticleSearchCursor = (cursor?: string | null): ArticleSearchCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<ArticleSearchCursor>;

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.publishedAt !== 'string' ||
      typeof parsed.rank !== 'number'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      publishedAt: parsed.publishedAt,
      rank: parsed.rank,
    };
  } catch {
    return null;
  }
};

/**
 * publish_at + id keyset 페이지 결과를 아티클 목록 응답 shape로 변환합니다.
 */
const toArticlesPage = (rows: ArticleListItem[], pageSize: number): ArticleListPage => {
  const page = buildPublishedAtIdPage({
    limit: pageSize,
    rows: rows.map(row => ({
      ...row,
      publishedAt: resolvePublicContentPublishedAt(row),
    })),
  });

  return {
    items: dedupeById(page.items.map(({ publishedAt: _publishedAt, ...item }) => item)),
    nextCursor: page.nextCursor,
    totalCount: null,
  };
};

/**
 * content schema(`articles` + `article_translations`)에서 locale별 기본 목록을 조회합니다.
 */
const fetchArticlesByLocaleFromShadow = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticleListPage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null, totalCount: null },
      schemaMissing: false,
    };
  }

  const parsedCursor = parsePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const translationsQuery = supabase
    .from('article_translations')
    .select(
      'article_id,title,description,articles!inner(created_at,thumbnail_url,slug,visibility,allow_comments,publish_at)',
    )
    .eq('locale', locale)
    .not('articles.publish_at', 'is', null)
    .not('articles.slug', 'is', null)
    .eq('articles.visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }), {
      referencedTable: 'articles',
    })
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
      referencedTable: 'articles',
    })
    .order('article_id', { ascending: false });

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

    throw new Error(`[articles] 번역 목록 조회 실패: ${translationsError.message}`);
  }

  return {
    data: toArticlesPage(
      mapArticleListItems((translationRows ?? []) as ArticleTranslationRow[]),
      pageSize,
    ),
    schemaMissing: false,
  };
};

const fetchArticlesByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticleListPage> => {
  const localizedArticles = await fetchArticlesByLocaleFromShadow(locale, cursor, pageSize);
  if (localizedArticles.schemaMissing) throw new Error('[articles] content schema가 없습니다.');

  return localizedArticles.data;
};

/**
 * 태그 relation table을 기준으로 현재 locale 번역 목록을 조회합니다.
 *
 * 태그 필터는 검색 RPC를 거치지 않고, relation 조회 후 content 목록을 조합합니다.
 */
const fetchArticlesByTagAndLocale = async (
  locale: string,
  tag: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticleListPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const resolvedTagId = await getTagIdBySlug(tag);
  if (resolvedTagId.schemaMissing) throw new Error('[articles] 태그 schema가 없습니다.');

  if (!resolvedTagId.data) return { items: [], nextCursor: null, totalCount: null };

  const articleIdsByTag = await getRelatedEntityIdsByTagId({
    entityColumn: 'article_id',
    relationTable: 'article_tags',
    tagId: resolvedTagId.data,
  });
  if (articleIdsByTag.schemaMissing) throw new Error('[articles] 태그 relation schema가 없습니다.');

  if (articleIdsByTag.data.length === 0) return { items: [], nextCursor: null, totalCount: null };

  const parsedCursor = parsePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const translationsQuery = supabase
    .from('article_translations')
    .select(
      'article_id,title,description,articles!inner(created_at,thumbnail_url,slug,visibility,allow_comments,publish_at)',
    )
    .eq('locale', locale)
    .in('article_id', articleIdsByTag.data)
    .not('articles.publish_at', 'is', null)
    .not('articles.slug', 'is', null)
    .eq('articles.visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }), {
      referencedTable: 'articles',
    })
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
      referencedTable: 'articles',
    })
    .order('article_id', { ascending: false });

  const { data: translationRows, error: translationsError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationsError) {
    if (isMissingArticlesShadowSchemaError(translationsError.message))
      throw new Error('[articles] content schema가 없습니다.');

    throw new Error(`[articles] 태그 목록 조회 실패: ${translationsError.message}`);
  }

  return toArticlesPage(
    mapArticleListItems((translationRows ?? []) as ArticleTranslationRow[]),
    pageSize,
  );
};

/**
 * RPC 검색 결과를 rank + publish_at + id keyset 페이지 형태로 변환합니다.
 *
 * RPC는 각 행마다 동일한 `total_count`를 포함하므로 첫 행의 메타데이터를 사용합니다.
 */
const toSearchArticlesPage = (rows: ArticleSearchRow[], pageSize: number): ArticleListPage => {
  const totalCount = rows[0]?.total_count ?? 0;
  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize);
  const lastItem = items.at(-1);

  return {
    items: items.map(({ search_rank: _rank, total_count: _totalCount, ...article }) => article),
    nextCursor:
      hasMore && lastItem
        ? serializeArticleSearchCursor({
            id: lastItem.id,
            publishedAt: resolvePublicContentPublishedAt(lastItem),
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
): Promise<ArticleListPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null, totalCount: null };

  const parsedCursor = parseArticleSearchCursor(cursor);
  const { data, error } = await supabase.rpc('search_article_translations', {
    cursor_id: parsedCursor?.id ?? null,
    cursor_publish_at: parsedCursor?.publishedAt ?? null,
    cursor_rank: parsedCursor?.rank ?? null,
    page_limit: pageSize,
    search_query: query,
    target_locale: locale,
  });

  if (error) throw new Error(`[articles] 검색 조회 실패: ${error.message}`);

  return toSearchArticlesPage((data ?? []) as ArticleSearchRow[], pageSize);
};

/**
 * 아티클 목록 조회 결과를 `use cache`로 캐시합니다.
 */
const readCachedArticles = async (input: {
  cursor: string | null | undefined;
  normalizedLocale: string;
  normalizedQuery: string;
  normalizedTag: string;
  pageSize: number;
}): Promise<ArticleListPage> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG);

  const parsedCursor = input.normalizedQuery
    ? parseArticleSearchCursor(input.cursor)
    : parsePublishedAtIdCursor(input.cursor);

  if (input.normalizedQuery) {
    return fetchSearchArticles(
      input.normalizedQuery,
      input.normalizedLocale,
      input.cursor,
      input.pageSize,
    );
  }

  if (input.normalizedTag) {
    return fetchArticlesByTagAndLocale(
      input.normalizedLocale,
      input.normalizedTag,
      input.cursor,
      input.pageSize,
    );
  }

  const isFirstPage = !parsedCursor;

  if (!isFirstPage) {
    return fetchArticlesByLocale(input.normalizedLocale, input.cursor, input.pageSize);
  }

  const localizedArticles = await fetchArticlesByLocale(
    input.normalizedLocale,
    input.cursor,
    input.pageSize,
  );
  if (localizedArticles.items.length > 0 || input.normalizedLocale === 'ko') {
    return localizedArticles;
  }

  return fetchArticlesByLocale('ko', input.cursor, input.pageSize);
};

/**
 * 첫 페이지의 실제 렌더링 locale을 포함해 아티클 목록을 조회합니다.
 *
 * 검색/태그 목록은 요청 locale 그대로 사용하고,
 * 기본 목록 첫 페이지에서만 `ko` fallback 여부를 함께 반환합니다.
 */
const readCachedResolvedArticlesFirstPage = async (input: {
  normalizedLocale: string;
  normalizedQuery: string;
  normalizedTag: string;
  pageSize: number;
}): Promise<ResolvedArticleListPage> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG);

  if (input.normalizedQuery) {
    return {
      page: await fetchSearchArticles(
        input.normalizedQuery,
        input.normalizedLocale,
        null,
        input.pageSize,
      ),
      resolvedLocale: input.normalizedLocale,
    };
  }

  if (input.normalizedTag) {
    return {
      page: await fetchArticlesByTagAndLocale(
        input.normalizedLocale,
        input.normalizedTag,
        null,
        input.pageSize,
      ),
      resolvedLocale: input.normalizedLocale,
    };
  }

  const localizedArticles = await fetchArticlesByLocale(
    input.normalizedLocale,
    null,
    input.pageSize,
  );
  if (localizedArticles.items.length > 0 || input.normalizedLocale === 'ko') {
    return {
      page: localizedArticles,
      resolvedLocale: input.normalizedLocale,
    };
  }

  return {
    page: await fetchArticlesByLocale('ko', null, input.pageSize),
    resolvedLocale: 'ko',
  };
};

/**
 * 첫 페이지의 실제 렌더링 locale과 함께 아티클 목록을 조회합니다.
 */
export const getResolvedArticlesFirstPage = async ({
  limit,
  locale,
  query,
  tag,
}: GetResolvedArticlesFirstPageOptions): Promise<ResolvedArticleListPage> => {
  if (!hasSupabaseEnv()) {
    return {
      page: { items: [], nextCursor: null, totalCount: null },
      resolvedLocale: locale.toLowerCase(),
    };
  }

  const normalizedLocale = locale.toLowerCase();
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedTag = normalizedQuery ? '' : normalizeArticleTag(tag);
  const pageSize = parseKeysetLimit(limit);

  return readCachedResolvedArticlesFirstPage({
    normalizedLocale,
    normalizedQuery,
    normalizedTag,
    pageSize,
  });
};

/**
 * 아티클 목록을 keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - 비검색 목록은 `publish_at + id` 기준 keyset pagination을 사용합니다.
 * - 검색 목록은 `rank + publish_at + id` 기준 keyset pagination을 사용합니다.
 * - locale 우선 조회 후, 비검색 첫 페이지에서만 번역 fallback으로 `ko`를 한 번 더 조회합니다.
 * - 반환 shape는 검색 여부와 상관없이 `items/nextCursor/totalCount`로 고정합니다.
 */
export const getArticles = async ({
  cursor,
  limit,
  locale,
  query,
  tag,
}: GetArticlesOptions): Promise<ArticleListPage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null, totalCount: null };

  const normalizedLocale = locale.toLowerCase();
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedTag = normalizedQuery ? '' : normalizeArticleTag(tag);
  const pageSize = parseKeysetLimit(limit);
  const isFirstPage = !cursor;

  if (isFirstPage) {
    return (
      await getResolvedArticlesFirstPage({
        limit: pageSize,
        locale: normalizedLocale,
        query: normalizedQuery,
        tag: normalizedTag,
      })
    ).page;
  }

  return readCachedArticles({
    cursor,
    normalizedLocale,
    normalizedQuery,
    normalizedTag,
    pageSize,
  });
};
