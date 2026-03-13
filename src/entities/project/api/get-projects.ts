import { unstable_cacheTag as cacheTag } from 'next/cache';

import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { resolvePublicContentPublishedAt } from '@/shared/lib/content/public-content';
import {
  buildContentLocaleFallbackChain,
  resolveFirstAvailableLocaleValue,
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

import { mapProjectListItems, type ProjectTranslationRow } from './map-project-translation';

const isMissingProjectsContentSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('projects') || normalizedMessage.includes('project_translations')
  );
};

type GetProjectsOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
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
 * content schema(`projects` + `project_translations`)에서 locale별 목록을 조회합니다.
 */
const fetchProjectsByLocaleFromContentSchema = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectListPage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: { items: [], nextCursor: null },
      schemaMissing: false,
    };
  }

  const parsedCursor = parsePublishedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const translationsQuery = supabase
    .from('project_translations')
    .select(
      'project_id,title,description,projects!inner(created_at,thumbnail_url,slug,visibility,allow_comments,publish_at)',
    )
    .eq('locale', locale)
    .not('projects.publish_at', 'is', null)
    .not('projects.slug', 'is', null)
    .eq('projects.visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }), {
      referencedTable: 'projects',
    })
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
      referencedTable: 'projects',
    })
    .order('project_id', { ascending: false });

  const { data: translationRows, error: translationError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationError) {
    if (isMissingProjectsContentSchemaError(translationError.message)) {
      return {
        data: { items: [], nextCursor: null },
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] 번역 목록 조회 실패: ${translationError.message}`);
  }

  return {
    data: toProjectsPage(
      mapProjectListItems((translationRows ?? []) as ProjectTranslationRow[]),
      pageSize,
    ),
    schemaMissing: false,
  };
};

const fetchProjectsByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectListPage> => {
  const localizedProjects = await fetchProjectsByLocaleFromContentSchema(locale, cursor, pageSize);
  if (localizedProjects.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  return localizedProjects.data;
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

  const parsedCursor = parsePublishedAtIdCursor(input.cursor);
  const isFirstPage = !parsedCursor;

  if (!isFirstPage) {
    return fetchProjectsByLocale(input.normalizedLocale, input.cursor, input.pageSize);
  }

  const page = await resolveFirstAvailableLocaleValue({
    fetchByLocale: candidateLocale =>
      fetchProjectsByLocale(candidateLocale, input.cursor, input.pageSize),
    hasValue: value => value.items.length > 0,
    locales: buildContentLocaleFallbackChain(input.normalizedLocale),
  });

  return page ?? { items: [], nextCursor: null };
};

/**
 * 프로젝트 목록을 publish_at + id keyset cursor 기반 페이지 단위로 조회합니다.
 *
 * - locale 우선 조회 후, 첫 페이지에서만 `ko` fallback을 시도합니다.
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
