import { unstable_cacheTag as cacheTag } from 'next/cache';

import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { resolvePublicContentPublishedAt } from '@/shared/lib/content/public-content';
import {
  buildContentLocaleFallbackChain,
  pickPreferredLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import {
  buildPublishedAtIdPage,
  parseKeysetLimit,
  parsePublishedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';
import { buildReferencedPublicContentFilter } from '@/shared/lib/supabase/build-public-content-filter';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectListItem, ProjectListPage } from '../model/types';

const isMissingProjectsContentSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  const hasMissingRelationText =
    normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist');

  return (
    hasMissingRelationText &&
    (normalizedMessage.includes('projects') || normalizedMessage.includes('project_translations'))
  );
};

type GetProjectsOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
};

type ProjectPublicBaseRow = Pick<ProjectListItem, 'id' | 'publish_at' | 'slug' | 'thumbnail_url'>;

type ProjectListTranslationSummaryRow = Pick<ProjectListItem, 'description' | 'title'> & {
  locale: string;
  project_id: string;
};

/**
 * keyset 페이지 결과를 프로젝트 목록 응답 shape로 변환합니다.
 */
const toProjectsPage = (rows: ProjectListItem[], pageSize: number): ProjectListPage => {
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
  };
};

/**
 * 공개 프로젝트 base row를 `publish_at + id` 기준으로 조회합니다.
 */
const fetchPublicProjectBaseRows = async (
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectPublicBaseRow[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      schemaMissing: false,
    };
  }

  const parsedCursor = parsePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const baseQuery = supabase
    .from('projects')
    .select('id,thumbnail_url,slug,visibility,publish_at')
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
    if (isMissingProjectsContentSchemaError(baseRowsError.message)) {
      return {
        data: [],
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] 공개 프로젝트 base row 조회 실패: ${baseRowsError.message}`);
  }

  return {
    data: (baseRows ?? []) as ProjectPublicBaseRow[],
    schemaMissing: false,
  };
};

/**
 * 공개 프로젝트 id 집합에 대해 locale fallback 후보 번역을 한 번에 조회합니다.
 */
const fetchProjectTranslationsByIds = async (
  projectIds: string[],
  localeFallbackChain: string[],
): Promise<{ data: ProjectListTranslationSummaryRow[]; schemaMissing: boolean }> => {
  if (projectIds.length === 0) {
    return {
      data: [],
      schemaMissing: false,
    };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      schemaMissing: false,
    };
  }

  const { data, error } = await supabase
    .from('project_translations')
    .select('project_id,locale,title,description')
    .in('project_id', projectIds)
    .in('locale', localeFallbackChain);

  if (error) {
    if (isMissingProjectsContentSchemaError(error.message)) {
      return {
        data: [],
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] 번역 목록 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []) as ProjectListTranslationSummaryRow[],
    schemaMissing: false,
  };
};

/**
 * base row 순서를 유지하면서 각 프로젝트에 가장 적합한 locale 번역을 결합합니다.
 */
const resolveProjectItemsWithLocaleFallback = async (
  baseRows: ProjectPublicBaseRow[],
  locale: string,
): Promise<ProjectListItem[]> => {
  if (baseRows.length === 0) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  const translationsResult = await fetchProjectTranslationsByIds(
    baseRows.map(row => row.id),
    localeFallbackChain,
  );
  if (translationsResult.schemaMissing) throw new Error('[projects] content schema가 없습니다.');

  const translationsByProjectId = new Map<string, ProjectListTranslationSummaryRow[]>();
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
      thumbnail_url: baseRow.thumbnail_url,
      title: preferredTranslation.title,
    };
  });
};

/**
 * 공개 프로젝트 기본 목록을 base row + locale fallback 번역으로 조회합니다.
 */
const fetchProjectsByLocaleFallback = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectListPage> => {
  const baseRowsResult = await fetchPublicProjectBaseRows(cursor, pageSize);
  if (baseRowsResult.schemaMissing) throw new Error('[projects] content schema가 없습니다.');

  const page = buildPublishedAtIdPage({
    limit: pageSize,
    rows: baseRowsResult.data.map(row => ({
      ...row,
      publishedAt: resolvePublicContentPublishedAt(row),
    })),
  });

  return toProjectsPage(
    await resolveProjectItemsWithLocaleFallback(
      page.items.map(({ publishedAt: _publishedAt, ...row }) => row),
      locale,
    ),
    pageSize,
  );
};

/**
 * 프로젝트 목록 조회 결과를 `use cache`로 캐시합니다.
 */
const readCachedProjects = async (input: {
  cursor: string | null | undefined;
  normalizedLocale: string;
  pageSize: number;
}): Promise<ProjectListPage> => {
  'use cache';

  cacheTag(PROJECTS_CACHE_TAG);

  return fetchProjectsByLocaleFallback(input.normalizedLocale, input.cursor, input.pageSize);
};

/**
 * 프로젝트 목록을 publish_at + id keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - 각 row마다 요청 locale -> `ko` -> `en` -> `ja` -> `fr` 순으로 번역을 채웁니다.
 */
export const getProjects = async ({
  cursor,
  limit,
  locale,
}: GetProjectsOptions): Promise<ProjectListPage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseKeysetLimit(limit);

  return readCachedProjects({
    cursor,
    normalizedLocale,
    pageSize,
  });
};
