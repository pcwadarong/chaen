import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  buildContentLocaleFallbackChain,
  resolveFirstAvailableLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import {
  buildCreatedAtIdPage,
  parseKeysetLimit,
  parseLocaleAwareCreatedAtIdCursor,
  serializeLocaleAwareCreatedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';
import { buildReferencedPublicContentFilter } from '@/shared/lib/supabase/build-public-content-filter';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectArchivePage, ProjectDetailListItem } from '../model/types';

import { mapProjectDetailListItems, type ProjectTranslationRow } from './map-project-translation';

type GetProjectDetailListOptions = {
  cursor?: string | null;
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
 * content schema(`projects` + `project_translations`) 기준 상세 아카이브 목록을 조회합니다.
 */
const fetchProjectDetailListFromContentSchema = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ProjectArchivePage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: { items: [], nextCursor: null }, schemaMissing: false };

  const parsedCursor = parseLocaleAwareCreatedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const translationsQuery = supabase
    .from('project_translations')
    .select('project_id,title,description,projects!inner(created_at,slug,visibility,publish_at)')
    .eq('locale', locale)
    .eq('projects.visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }), {
      referencedTable: 'projects',
    })
    .order('created_at', { ascending: false, referencedTable: 'projects' })
    .order('project_id', { ascending: false });

  const { data: translationRows, error: translationError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationError) {
    if (isMissingProjectContentSchemaError(translationError)) {
      return { data: { items: [], nextCursor: null }, schemaMissing: true };
    }

    throw new Error(`[projects] 상세 목록 번역 조회 실패: ${translationError.message}`);
  }

  const rows = mapProjectDetailListItems((translationRows ?? []) as ProjectTranslationRow[]);
  const page = buildCreatedAtIdPage({
    limit: pageSize,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  });

  return {
    data: {
      items: page.items.map(({ createdAt: _createdAt, ...item }) => item as ProjectDetailListItem),
      nextCursor:
        page.nextCursor && page.items.at(-1)
          ? serializeLocaleAwareCreatedAtIdCursor({
              createdAt: page.items.at(-1)?.createdAt ?? '',
              id: page.items.at(-1)?.id ?? '',
              locale,
            })
          : null,
    },
    schemaMissing: false,
  };
};

const fetchProjectDetailListByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ProjectArchivePage> => {
  const projectDetailList = await fetchProjectDetailListFromContentSchema(locale, cursor, pageSize);
  if (projectDetailList.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  return projectDetailList.data;
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

  const parsedCursor = parseLocaleAwareCreatedAtIdCursor(input.cursor);
  const localeFallbackChain = parsedCursor
    ? [parsedCursor.locale]
    : buildContentLocaleFallbackChain(input.normalizedLocale);

  const page = await resolveFirstAvailableLocaleValue({
    fetchByLocale: candidateLocale =>
      fetchProjectDetailListByLocale(candidateLocale, input.cursor, input.pageSize),
    hasValue: value => value.items.length > 0,
    locales: localeFallbackChain,
  });

  return page ?? { items: [], nextCursor: null };
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
