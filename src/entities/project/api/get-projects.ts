import { unstable_cache } from 'next/cache';

import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  buildCreatedAtIdPage,
  parseCreatedAtIdCursor,
  parseKeysetLimit,
} from '@/shared/lib/pagination/keyset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectListItem } from '../model/types';

const isMissingProjectsShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('projects_v2') || normalizedMessage.includes('project_translations')
  );
};

type ProjectsPage = {
  items: ProjectListItem[];
  nextCursor: string | null;
};

type GetProjectsOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
};

type ProjectBaseListRow = Pick<ProjectListItem, 'created_at' | 'id' | 'thumbnail_url'>;

type ProjectTranslationListRow = Pick<ProjectListItem, 'description' | 'title'> & {
  project_id: string;
};

/**
 * keyset 페이지 결과를 프로젝트 목록 응답 shape로 변환합니다.
 */
const toProjectsPage = (rows: ProjectListItem[], pageSize: number): ProjectsPage => {
  const page = buildCreatedAtIdPage({
    limit: pageSize,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  });

  return {
    items: dedupeById(
      page.items.map(({ createdAt: _createdAt, ...item }) => item as ProjectListItem),
    ),
    nextCursor: page.nextCursor,
  };
};

/**
 * 내림차순 created_at + id 정렬 기준 keyset 조건을 쿼리에 적용합니다.
 */
const applyProjectsKeysetCursor = <
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
 * shadow schema(`projects_v2` + `project_translations`)에서 locale별 목록을 조회합니다.
 */
const fetchProjectsByLocaleFromShadow = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectsPage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null },
      schemaMissing: false,
    };
  }

  const baseQuery = applyProjectsKeysetCursor(
    supabase.from('projects_v2').select('id,thumbnail_url,created_at'),
    cursor,
  );
  const { data: projectBaseRows, error: projectBaseError } = await baseQuery.limit(pageSize + 1);

  if (projectBaseError) {
    if (isMissingProjectsShadowSchemaError(projectBaseError.message)) {
      return {
        data: { items: [], nextCursor: null },
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] shadow base 목록 조회 실패: ${projectBaseError.message}`);
  }

  const baseRows = (projectBaseRows ?? []) as ProjectBaseListRow[];
  if (baseRows.length === 0) {
    return {
      data: { items: [], nextCursor: null },
      schemaMissing: false,
    };
  }

  const projectIds = Array.from(new Set(baseRows.map(row => row.id)));
  const { data: translationRows, error: translationError } = await supabase
    .from('project_translations')
    .select('project_id,title,description')
    .eq('locale', locale)
    .in('project_id', projectIds);

  if (translationError) {
    if (isMissingProjectsShadowSchemaError(translationError.message)) {
      return {
        data: { items: [], nextCursor: null },
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] shadow 번역 목록 조회 실패: ${translationError.message}`);
  }

  const translationMap = new Map(
    ((translationRows ?? []) as ProjectTranslationListRow[]).map(row => [row.project_id, row]),
  );

  return {
    data: toProjectsPage(
      baseRows.flatMap(row => {
        const translation = translationMap.get(row.id);
        if (!translation) return [];

        return [
          {
            created_at: row.created_at,
            description: translation.description,
            id: row.id,
            thumbnail_url: row.thumbnail_url,
            title: translation.title,
          } satisfies ProjectListItem,
        ];
      }),
      pageSize,
    ),
    schemaMissing: false,
  };
};

const fetchProjectsByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectsPage> => {
  const shadowProjects = await fetchProjectsByLocaleFromShadow(locale, cursor, pageSize);
  if (shadowProjects.schemaMissing) {
    throw new Error('[projects] shadow content schema가 없습니다.');
  }

  return shadowProjects.data;
};

/**
 * 프로젝트 목록을 created_at + id keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - locale 우선 조회 후, 첫 페이지에서만 `ko` fallback을 시도합니다.
 */
export const getProjects = async ({
  cursor,
  limit,
  locale,
}: GetProjectsOptions): Promise<ProjectsPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseKeysetLimit(limit);
  const parsedCursor = parseCreatedAtIdCursor(cursor);
  const cacheCursor = parsedCursor ? `${parsedCursor.createdAt}:${parsedCursor.id}` : 'initial';

  const getCachedProjects = unstable_cache(
    async () => {
      const isFirstPage = !parsedCursor;

      if (!isFirstPage) {
        return fetchProjectsByLocale(normalizedLocale, cursor, pageSize);
      }

      const localizedProjects = await fetchProjectsByLocale(normalizedLocale, cursor, pageSize);
      if (localizedProjects.items.length > 0 || normalizedLocale === 'ko') {
        return localizedProjects;
      }

      return fetchProjectsByLocale('ko', cursor, pageSize);
    },
    ['projects', 'list', cacheScope, normalizedLocale, cacheCursor, String(pageSize)],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjects();
};
