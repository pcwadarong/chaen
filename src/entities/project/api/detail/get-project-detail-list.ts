import { unstable_cacheTag as cacheTag } from 'next/cache';

import { PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import type { ProjectArchivePage } from '@/entities/project/model/types';
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

type ProjectArchiveBaseRow = {
  id: string;
  publish_at: string;
  slug: string;
};

type ProjectArchiveTranslationSummaryRow = {
  description: string | null;
  locale: string;
  project_id: string;
  title: string;
};

type GetProjectDetailListOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
};

type GetProjectDetailListWindowOptions = {
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

const isMissingProjectContentSchemaError = (error: { code?: string | null; message: string }) => {
  if (error.code === '42P01') {
    return true;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes('does not exist') &&
    (normalizedMessage.includes('projects') || normalizedMessage.includes('project_translations'))
  );
};

/**
 * 공개 프로젝트 base row를 `publish_at + id` 기준으로 조회합니다.
 */
const fetchProjectArchiveBaseRows = async (
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectArchiveBaseRow[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const parsedCursor = parseLocaleAwarePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const baseQuery = supabase
    .from('projects')
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
    if (isMissingProjectContentSchemaError(baseRowsError)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] 상세 목록 base row 조회 실패: ${baseRowsError.message}`);
  }

  return {
    data: (baseRows ?? []) as ProjectArchiveBaseRow[],
    schemaMissing: false,
  };
};

/**
 * 현재 프로젝트보다 더 최신인 base row를 현재 항목에 가까운 순서로 조회합니다.
 */
const fetchNewerProjectArchiveBaseRows = async (
  currentItem: GetProjectDetailListWindowOptions['currentItem'],
  pageSize: number,
): Promise<{ data: ProjectArchiveBaseRow[]; schemaMissing: boolean }> => {
  if (pageSize <= 0) {
    return { data: [], schemaMissing: false };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const nowIsoString = new Date().toISOString();
  const { data, error } = await supabase
    .from('projects')
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
    if (isMissingProjectContentSchemaError(error)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] 상세 목록 최신 base row 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []) as ProjectArchiveBaseRow[],
    schemaMissing: false,
  };
};

/**
 * 공개 프로젝트 id 집합에 대해 locale fallback 후보 번역을 한 번에 조회합니다.
 */
const fetchProjectArchiveTranslationsByIds = async (
  projectIds: string[],
  localeFallbackChain: string[],
): Promise<{ data: ProjectArchiveTranslationSummaryRow[]; schemaMissing: boolean }> => {
  if (projectIds.length === 0) {
    return { data: [], schemaMissing: false };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase
    .from('project_translations')
    .select('project_id,locale,title,description')
    .in('project_id', projectIds)
    .in('locale', localeFallbackChain);

  if (error) {
    if (isMissingProjectContentSchemaError(error)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] 상세 목록 번역 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []) as ProjectArchiveTranslationSummaryRow[],
    schemaMissing: false,
  };
};

/**
 * base row 순서를 유지하면서 상세 아카이브 항목에 locale fallback 번역을 결합합니다.
 */
const resolveProjectArchiveItemsWithLocaleFallback = async (
  baseRows: ProjectArchiveBaseRow[],
  locale: string,
): Promise<ProjectArchivePage['items']> => {
  if (baseRows.length === 0) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  const translationsResult = await fetchProjectArchiveTranslationsByIds(
    baseRows.map(row => row.id),
    localeFallbackChain,
  );
  if (translationsResult.schemaMissing) throw new Error('[projects] content schema가 없습니다.');

  const translationsByProjectId = new Map<string, ProjectArchiveTranslationSummaryRow[]>();
  translationsResult.data.forEach(row => {
    const rows = translationsByProjectId.get(row.project_id) ?? [];
    rows.push(row);
    translationsByProjectId.set(row.project_id, rows);
  });

  return baseRows.map(baseRow => {
    const translationRows = translationsByProjectId.get(baseRow.id) ?? [];
    const preferredTranslation = pickPreferredLocaleValue({
      locales: localeFallbackChain,
      resolveLocale: row => row.locale,
      rows: translationRows,
    });

    if (!preferredTranslation) {
      throw new Error(
        `[projects] 조회 가능한 번역이 없습니다. projectId=${baseRow.id} locales=${localeFallbackChain.join('>')}`,
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
const fetchProjectDetailListByLocaleFallback = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectArchivePage> => {
  const baseRowsResult = await fetchProjectArchiveBaseRows(cursor, pageSize);
  if (baseRowsResult.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  const page = buildPublishedAtIdPage({
    limit: pageSize,
    rows: baseRowsResult.data.map(row => ({
      ...row,
      publishedAt: resolvePublicContentPublishedAt(row),
    })),
  });

  return {
    items: await resolveProjectArchiveItemsWithLocaleFallback(
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
 * 프로젝트 상세 아카이브 목록을 `use cache`로 캐시합니다.
 */
const readCachedProjectDetailList = async (input: {
  cursor: string | null | undefined;
  normalizedLocale: string;
  pageSize: number;
}): Promise<ProjectArchivePage> => {
  'use cache';

  cacheTag(PROJECTS_CACHE_TAG);

  const parsedCursor = parseLocaleAwarePublishedAtIdCursor(input.cursor);
  const requestedLocale = parsedCursor?.locale ?? input.normalizedLocale;

  return fetchProjectDetailListByLocaleFallback(requestedLocale, input.cursor, input.pageSize);
};

/**
 * 프로젝트 상세 좌측 아카이브 목록을 가져옵니다.
 *
 * 현재 UI는 첫 페이지만 사용하지만, 조회 자체는 keyset 정렬 기준으로 통일합니다.
 */
export const getProjectDetailList = async ({
  cursor,
  limit,
  locale,
}: GetProjectDetailListOptions): Promise<ProjectArchivePage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseKeysetLimit(limit);

  return readCachedProjectDetailList({
    cursor,
    normalizedLocale,
    pageSize,
  });
};

/**
 * 현재 상세 프로젝트를 기준으로 자연스러운 위치의 초기 아카이브 slice를 구성합니다.
 */
export const getProjectDetailListWindow = async ({
  currentItem,
  limit,
  locale,
}: GetProjectDetailListWindowOptions): Promise<ProjectArchivePage> => {
  if (!hasSupabaseEnv()) {
    return {
      items: [currentItem],
      nextCursor: null,
    };
  }

  const pageSize = parseKeysetLimit(limit);
  const olderPage = await getProjectDetailList({
    cursor: serializeLocaleAwarePublishedAtIdCursor({
      id: currentItem.id,
      locale,
      publishedAt: currentItem.publish_at,
    }),
    limit: Math.max(pageSize - 1, 0),
    locale,
  });

  const remainingSlots = Math.max(pageSize - (olderPage.items.length + 1), 0);
  if (remainingSlots === 0) {
    return {
      items: [currentItem, ...olderPage.items],
      nextCursor: olderPage.nextCursor,
    };
  }

  const newerBaseRowsResult = await fetchNewerProjectArchiveBaseRows(currentItem, remainingSlots);
  if (newerBaseRowsResult.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  const newerItemsAscending = await resolveProjectArchiveItemsWithLocaleFallback(
    newerBaseRowsResult.data,
    locale,
  );

  return {
    items: [...newerItemsAscending.reverse(), currentItem, ...olderPage.items],
    nextCursor: olderPage.nextCursor,
  };
};
