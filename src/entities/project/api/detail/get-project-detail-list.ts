import { unstable_cacheTag as cacheTag } from 'next/cache';

import { PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import type { ProjectArchivePage } from '@/entities/project/model/types';
import {
  buildContentLocaleFallbackChain,
  pickPreferredLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import {
  buildOffsetPage,
  parseOffsetCursor,
  parseOffsetLimit,
} from '@/shared/lib/pagination/offset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type ProjectArchiveBaseRow = {
  display_order: number | null;
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
 * 공개 프로젝트 base row를 `display_order -> publish_at -> id` 기준으로 조회합니다.
 */
const fetchProjectArchiveBaseRows = async (): Promise<{
  data: ProjectArchiveBaseRow[];
  schemaMissing: boolean;
}> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const nowIsoString = new Date().toISOString();
  const { data: baseRows, error: baseRowsError } = await supabase
    .from('projects')
    .select('id,slug,visibility,publish_at,display_order')
    .not('publish_at', 'is', null)
    .not('slug', 'is', null)
    .eq('visibility', 'public')
    .lte('publish_at', nowIsoString)
    .order('display_order', {
      ascending: true,
      nullsFirst: false,
    })
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
    })
    .order('id', { ascending: false })
    .limit(1000);

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
  const baseRowsResult = await fetchProjectArchiveBaseRows();
  if (baseRowsResult.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  const page = buildOffsetPage({
    cursor,
    items: baseRowsResult.data,
    limit: pageSize,
  });

  return {
    items: await resolveProjectArchiveItemsWithLocaleFallback(page.items, locale),
    nextCursor: page.nextCursor,
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

  return fetchProjectDetailListByLocaleFallback(
    input.normalizedLocale,
    input.cursor,
    input.pageSize,
  );
};

/**
 * 프로젝트 상세 좌측 아카이브 목록을 가져옵니다.
 */
export const getProjectDetailList = async ({
  cursor,
  limit,
  locale,
}: GetProjectDetailListOptions): Promise<ProjectArchivePage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseOffsetLimit(limit);

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

  const pageSize = parseOffsetLimit(limit);
  const baseRowsResult = await fetchProjectArchiveBaseRows();
  if (baseRowsResult.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  const currentIndex = baseRowsResult.data.findIndex(row => row.id === currentItem.id);
  const fallbackStartIndex = parseOffsetCursor(null);
  const offset = Math.max(pageSize - 1, 0);
  /**
   * 현재 항목을 page window의 끝쪽에 두도록 시작 offset을 계산합니다.
   * 현재 항목을 찾지 못하면 기본 cursor 시작점(0)으로 폴백합니다.
   */
  const startIndex = currentIndex < 0 ? fallbackStartIndex : Math.max(0, currentIndex - offset);
  const windowRows = baseRowsResult.data.slice(startIndex, startIndex + pageSize);
  const resolvedItems = await resolveProjectArchiveItemsWithLocaleFallback(windowRows, locale);

  return {
    items: resolvedItems,
    nextCursor:
      startIndex + resolvedItems.length < baseRowsResult.data.length
        ? String(startIndex + resolvedItems.length)
        : null,
  };
};
