import { unstable_cache } from 'next/cache';

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

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectListItem } from '../model/types';

type ProjectsPage = {
  items: ProjectListItem[];
  nextCursor: string | null;
};

type GetProjectsOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
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
 * locale 컬럼을 사용하는 프로젝트 목록 페이지 조회입니다.
 *
 * 첫 페이지와 다음 페이지 모두 동일한 keyset 정렬을 사용하고,
 * 첫 페이지 locale fallback 여부만 상위 로직에서 결정합니다.
 */
const fetchProjectsByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectsPage; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null },
      localeColumnMissing: false,
    };
  }

  const query = applyProjectsKeysetCursor(
    supabase
      .from('projects')
      .select('id,title,description,thumbnail_url,created_at')
      .eq('locale', locale),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: { items: [], nextCursor: null },
        localeColumnMissing: true,
      };
    }

    throw new Error(`[projects] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: toProjectsPage((data ?? []) as ProjectListItem[], pageSize),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 프로젝트 목록 페이지 조회입니다.
 */
const fetchProjectsLegacy = async (
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectsPage> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { items: [], nextCursor: null };

  const query = applyProjectsKeysetCursor(
    supabase.from('projects').select('id,title,description,thumbnail_url,created_at'),
    cursor,
  );
  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    throw new Error(`[projects] 목록 조회 실패: ${error.message}`);
  }

  return toProjectsPage((data ?? []) as ProjectListItem[], pageSize);
};

/**
 * 프로젝트 목록을 created_at + id keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - locale 우선 조회 후, 첫 페이지에서만 `ko` fallback을 시도합니다.
 * - locale 컬럼 미존재 스키마에서는 legacy 조회로 자동 전환합니다.
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
        const localizedResult = await fetchProjectsByLocale(normalizedLocale, cursor, pageSize);
        if (localizedResult.localeColumnMissing) {
          return fetchProjectsLegacy(cursor, pageSize);
        }

        return localizedResult.data;
      }

      return resolveLocaleAwareData<ProjectsPage>({
        emptyData: { items: [], nextCursor: null },
        fallbackLocale: 'ko',
        fetchByLocale: targetLocale => fetchProjectsByLocale(targetLocale, cursor, pageSize),
        fetchLegacy: () => fetchProjectsLegacy(cursor, pageSize),
        isEmptyData: page => page.items.length === 0,
        targetLocale: normalizedLocale,
      });
    },
    ['projects', 'list', cacheScope, normalizedLocale, cacheCursor, String(pageSize)],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjects();
};
