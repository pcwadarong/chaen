import { unstable_cache } from 'next/cache';

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

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectListItem } from '../model/types';

const isMissingProjectsShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.projects) ||
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.projectTranslations)
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

type ProjectTranslationListRow = Pick<ProjectListItem, 'description' | 'title'> & {
  project_id: string;
};

type ProjectTranslationWithBaseRow = ProjectTranslationListRow & {
  projects: Pick<ProjectListItem, 'created_at' | 'thumbnail_url'>[] | null;
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

const mapShadowProjectListItems = (translationRows: ProjectTranslationWithBaseRow[]) =>
  translationRows.flatMap(row => {
    const project = row.projects?.[0];
    if (!project) return [];

    return [
      {
        created_at: project.created_at,
        description: row.description,
        id: row.project_id,
        thumbnail_url: project.thumbnail_url,
        title: row.title,
      } satisfies ProjectListItem,
    ];
  });

/**
 * content schema(`projects` + `project_translations`)에서 locale별 목록을 조회합니다.
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

  const parsedCursor = parseCreatedAtIdCursor(cursor);
  let translationsQuery = supabase
    .from(CONTENT_SHADOW_SCHEMA.projectTranslations)
    .select('project_id,title,description,projects!inner(created_at,thumbnail_url)')
    .eq('locale', locale)
    .order('created_at', { ascending: false, referencedTable: 'projects' })
    .order('project_id', { ascending: false });

  if (parsedCursor) {
    translationsQuery = translationsQuery.or(
      `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},project_id.lt.${parsedCursor.id})`,
      { referencedTable: 'projects' },
    );
  }

  const { data: translationRows, error: translationError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationError) {
    if (isMissingProjectsShadowSchemaError(translationError.message)) {
      return {
        data: { items: [], nextCursor: null },
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] shadow 번역 목록 조회 실패: ${translationError.message}`);
  }

  return {
    data: toProjectsPage(
      mapShadowProjectListItems((translationRows ?? []) as ProjectTranslationWithBaseRow[]),
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
