import { unstable_cacheTag as cacheTag } from 'next/cache';

import { ARTICLES_CACHE_TAG } from '@/entities/article/model/cache-tags';
import type { ArticleArchivePage } from '@/entities/article/model/types';
import { resolvePublicContentPublishedAt } from '@/shared/lib/content/public-content';
import {
  buildContentLocaleFallbackChain,
  pickPreferredLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import {
  buildPublishedAtIdPage,
  parseKeysetLimit,
  parseLocaleAwarePublishedAtIdCursor,
  serializeLocaleAwarePublishedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';
import { buildReferencedPublicContentFilter } from '@/shared/lib/supabase/build-public-content-filter';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type ArticleArchiveBaseRow = {
  id: string;
  publish_at: string;
  slug: string;
};

type ArticleArchiveTranslationSummaryRow = {
  article_id: string;
  description: string | null;
  locale: string;
  title: string;
};

type GetArticleDetailListOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
};

type GetArticleDetailListWindowOptions = {
  currentItem: {
    description: string | null;
    id: string;
    publish_at: string;
    slug: string;
    title: string;
  };
  limit?: number;
  locale: string;
};

const isMissingArticleContentSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  const hasMissingRelationText =
    normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist');

  return (
    hasMissingRelationText &&
    (normalizedMessage.includes('articles') || normalizedMessage.includes('article_translations'))
  );
};

/**
 * 공개 아티클 base row를 `publish_at + id` 기준으로 조회합니다.
 */
const fetchArticleArchiveBaseRows = async (
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticleArchiveBaseRow[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const parsedCursor = parseLocaleAwarePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const baseQuery = supabase
    .from('articles')
    .select('id,slug,visibility,publish_at')
    .not('publish_at', 'is', null)
    .not('slug', 'is', null)
    .eq('visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }))
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
    })
    .order('id', { ascending: false });

  const { data: baseRows, error: baseRowsError } = await baseQuery.limit(pageSize + 1);

  if (baseRowsError) {
    if (isMissingArticleContentSchemaError(baseRowsError.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[articles] 상세 목록 base row 조회 실패: ${baseRowsError.message}`);
  }

  return {
    data: (baseRows ?? []) as ArticleArchiveBaseRow[],
    schemaMissing: false,
  };
};

/**
 * 현재 아티클보다 더 최신인 base row를 현재 글에 가까운 순서로 조회합니다.
 */
const fetchNewerArticleArchiveBaseRows = async (
  currentItem: GetArticleDetailListWindowOptions['currentItem'],
  pageSize: number,
): Promise<{ data: ArticleArchiveBaseRow[]; schemaMissing: boolean }> => {
  if (pageSize <= 0) {
    return { data: [], schemaMissing: false };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const nowIsoString = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select('id,slug,visibility,publish_at')
    .not('publish_at', 'is', null)
    .not('slug', 'is', null)
    .eq('visibility', 'public')
    .or(
      [
        `and(publish_at.lte.${nowIsoString},publish_at.gt.${currentItem.publish_at})`,
        `and(publish_at.lte.${nowIsoString},publish_at.eq.${currentItem.publish_at},id.gt.${currentItem.id})`,
      ].join(','),
    )
    .order('publish_at', {
      ascending: true,
      nullsFirst: false,
    })
    .order('id', { ascending: true })
    .limit(pageSize);

  if (error) {
    if (isMissingArticleContentSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[articles] 상세 목록 최신 base row 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []) as ArticleArchiveBaseRow[],
    schemaMissing: false,
  };
};

/**
 * 공개 아티클 id 집합에 대해 locale fallback 후보 번역을 한 번에 조회합니다.
 */
const fetchArticleArchiveTranslationsByIds = async (
  articleIds: string[],
  localeFallbackChain: string[],
): Promise<{ data: ArticleArchiveTranslationSummaryRow[]; schemaMissing: boolean }> => {
  if (articleIds.length === 0) {
    return { data: [], schemaMissing: false };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase
    .from('article_translations')
    .select('article_id,locale,title,description')
    .in('article_id', articleIds)
    .in('locale', localeFallbackChain);

  if (error) {
    if (isMissingArticleContentSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[articles] 상세 목록 번역 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []) as ArticleArchiveTranslationSummaryRow[],
    schemaMissing: false,
  };
};

/**
 * base row 순서를 유지하면서 상세 아카이브 항목에 locale fallback 번역을 결합합니다.
 */
const resolveArticleArchiveItemsWithLocaleFallback = async (
  baseRows: ArticleArchiveBaseRow[],
  locale: string,
): Promise<ArticleArchivePage['items']> => {
  if (baseRows.length === 0) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  const translationsResult = await fetchArticleArchiveTranslationsByIds(
    baseRows.map(row => row.id),
    localeFallbackChain,
  );
  if (translationsResult.schemaMissing) throw new Error('[articles] content schema가 없습니다.');

  const translationsByArticleId = new Map<string, ArticleArchiveTranslationSummaryRow[]>();
  translationsResult.data.forEach(row => {
    const rows = translationsByArticleId.get(row.article_id) ?? [];
    rows.push(row);
    translationsByArticleId.set(row.article_id, rows);
  });

  return baseRows.map(baseRow => {
    const translationRows = translationsByArticleId.get(baseRow.id) ?? [];
    const preferredTranslation = pickPreferredLocaleValue({
      locales: localeFallbackChain,
      resolveLocale: row => row.locale,
      rows: translationRows,
    });

    if (!preferredTranslation) {
      throw new Error(
        `[articles] 조회 가능한 번역이 없습니다. articleId=${baseRow.id} locales=${localeFallbackChain.join('>')}`,
      );
    }

    return {
      description: preferredTranslation.description,
      id: baseRow.id,
      publish_at: baseRow.publish_at,
      slug: baseRow.slug,
      title: preferredTranslation.title,
    };
  });
};

/**
 * 공개 상세 아카이브 목록을 base row + locale fallback 번역으로 조회합니다.
 */
const fetchArticleDetailListByLocaleFallback = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticleArchivePage> => {
  const baseRowsResult = await fetchArticleArchiveBaseRows(cursor, pageSize);
  if (baseRowsResult.schemaMissing) {
    throw new Error('[articles] content schema가 없습니다.');
  }

  const page = buildPublishedAtIdPage({
    limit: pageSize,
    rows: baseRowsResult.data.map(row => ({
      ...row,
      publishedAt: resolvePublicContentPublishedAt(row),
    })),
  });

  return {
    items: await resolveArticleArchiveItemsWithLocaleFallback(
      page.items.map(({ publishedAt: _publishedAt, ...row }) => row),
      locale,
    ),
    nextCursor: page.nextCursor
      ? serializeLocaleAwarePublishedAtIdCursor({
          id: page.items.at(-1)!.id,
          locale,
          publishedAt: page.items.at(-1)!.publishedAt,
        })
      : null,
  };
};

/**
 * 아티클 상세 아카이브 목록을 `use cache`로 캐시합니다.
 */
const readCachedArticleDetailList = async (input: {
  cursor: string | null | undefined;
  normalizedLocale: string;
  pageSize: number;
}): Promise<ArticleArchivePage> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG);

  const parsedCursor = parseLocaleAwarePublishedAtIdCursor(input.cursor);
  const requestedLocale = parsedCursor?.locale ?? input.normalizedLocale;

  return fetchArticleDetailListByLocaleFallback(requestedLocale, input.cursor, input.pageSize);
};

/**
 * 현재 항목 위쪽에 둘 초기 window slot 수를 계산합니다.
 *
 * 활성 항목을 viewport 25% 지점 근처에 두는 상세 아카이브 정책과 맞추기 위해
 * 전체 이웃 slot 중 일부만 위쪽에 배치하고, 나머지는 아래쪽 문맥에 우선 할당합니다.
 */
const getPreferredLeadingWindowSlotCount = (neighborSlots: number) => {
  if (neighborSlots <= 0) return 0;

  return Math.min(neighborSlots, Math.max(1, Math.round(neighborSlots * 0.25)));
};

/**
 * 아티클 상세 좌측 아카이브 목록의 cursor 기반 페이지를 가져옵니다.
 */
export const getArticleDetailList = async ({
  cursor,
  limit,
  locale,
}: GetArticleDetailListOptions): Promise<ArticleArchivePage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseKeysetLimit(limit);

  return readCachedArticleDetailList({
    cursor,
    normalizedLocale,
    pageSize,
  });
};

/**
 * 현재 상세 아티클을 기준으로 자연스러운 위치의 초기 아카이브 slice를 구성합니다.
 */
export const getArticleDetailListWindow = async ({
  currentItem,
  limit,
  locale,
}: GetArticleDetailListWindowOptions): Promise<ArticleArchivePage> => {
  if (!hasSupabaseEnv()) {
    return {
      items: [currentItem],
      nextCursor: null,
    };
  }

  const pageSize = parseKeysetLimit(limit);
  const neighborSlots = Math.max(pageSize - 1, 0);
  if (neighborSlots === 0) {
    return {
      items: [currentItem],
      nextCursor: null,
    };
  }

  const leadingSlots = getPreferredLeadingWindowSlotCount(neighborSlots);
  const trailingSlots = neighborSlots - leadingSlots;
  const olderCursor = serializeLocaleAwarePublishedAtIdCursor({
    id: currentItem.id,
    locale,
    publishedAt: currentItem.publish_at,
  });

  let olderPage = await getArticleDetailList({
    cursor: olderCursor,
    limit: trailingSlots,
    locale,
  });
  let newerBaseRowsResult = await fetchNewerArticleArchiveBaseRows(currentItem, leadingSlots);
  if (newerBaseRowsResult.schemaMissing) {
    throw new Error('[articles] content schema가 없습니다.');
  }

  let newerItemsAscending = await resolveArticleArchiveItemsWithLocaleFallback(
    newerBaseRowsResult.data,
    locale,
  );
  const currentNeighborCount = olderPage.items.length + newerItemsAscending.length;

  if (currentNeighborCount < neighborSlots) {
    const shortfall = neighborSlots - currentNeighborCount;

    if (olderPage.items.length < trailingSlots) {
      newerBaseRowsResult = await fetchNewerArticleArchiveBaseRows(
        currentItem,
        leadingSlots + shortfall,
      );

      if (newerBaseRowsResult.schemaMissing) {
        throw new Error('[articles] content schema가 없습니다.');
      }

      newerItemsAscending = await resolveArticleArchiveItemsWithLocaleFallback(
        newerBaseRowsResult.data,
        locale,
      );
    } else if (newerItemsAscending.length < leadingSlots) {
      olderPage = await getArticleDetailList({
        cursor: olderCursor,
        limit: trailingSlots + shortfall,
        locale,
      });
    }
  }

  return {
    items: [...newerItemsAscending.reverse(), currentItem, ...olderPage.items],
    nextCursor: olderPage.nextCursor,
  };
};
