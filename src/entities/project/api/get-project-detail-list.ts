import { unstable_cache } from 'next/cache';

import { buildCreatedAtIdPage } from '@/shared/lib/pagination/keyset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectDetailListItem } from '../model/types';

const DETAIL_LIST_LIMIT = 200;

const isMissingProjectShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('projects_v2') || normalizedMessage.includes('project_translations')
  );
};

type ProjectDetailBaseRow = Pick<ProjectDetailListItem, 'created_at' | 'id'>;

type ProjectDetailTranslationRow = Pick<ProjectDetailListItem, 'description' | 'title'> & {
  project_id: string;
};

/**
 * 프로젝트 상세 아카이브용 요약 목록을 정규화합니다.
 */
const toProjectDetailListItems = (rows: ProjectDetailListItem[]): ProjectDetailListItem[] =>
  buildCreatedAtIdPage({
    limit: DETAIL_LIST_LIMIT,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  }).items.map(({ createdAt: _createdAt, ...row }) => ({
    created_at: row.created_at,
    description: row.description,
    id: row.id,
    title: row.title,
  }));

/**
 * keyset 정렬 기준으로 프로젝트 요약 목록 쿼리를 구성합니다.
 */
const createProjectDetailListQuery = (locale?: string) => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const baseQuery = supabase
    .from('projects')
    .select('id,title,description,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  return locale ? baseQuery.eq('locale', locale) : baseQuery;
};

/**
 * locale 컬럼을 사용하는 기존 스키마 프로젝트 요약 목록을 조회합니다.
 */
const fetchProjectDetailListByLocaleLegacy = async (
  locale: string,
): Promise<{ data: ProjectDetailListItem[]; localeColumnMissing: boolean }> => {
  const query = createProjectDetailListQuery(locale);
  if (!query) {
    return {
      data: [],
      localeColumnMissing: false,
    };
  }

  const { data, error } = await query.limit(DETAIL_LIST_LIMIT + 1);

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[projects] 상세 목록 조회 실패: ${error.message}`);
  }

  return {
    data: toProjectDetailListItems((data ?? []) as ProjectDetailListItem[]),
    localeColumnMissing: false,
  };
};

/**
 * shadow schema(`projects_v2` + `project_translations`) 기준 상세 아카이브 목록을 조회합니다.
 */
const fetchProjectDetailListFromShadow = async (
  locale: string,
): Promise<{ data: ProjectDetailListItem[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data: projectBaseRows, error: projectBaseError } = await supabase
    .from('projects_v2')
    .select('id,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(DETAIL_LIST_LIMIT + 1);

  if (projectBaseError) {
    if (isMissingProjectShadowSchemaError(projectBaseError.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] shadow 상세 목록 base 조회 실패: ${projectBaseError.message}`);
  }

  const baseRows = (projectBaseRows ?? []) as ProjectDetailBaseRow[];
  if (baseRows.length === 0) return { data: [], schemaMissing: false };

  const projectIds = Array.from(new Set(baseRows.map(row => row.id)));
  const { data: translationRows, error: translationError } = await supabase
    .from('project_translations')
    .select('project_id,title,description')
    .eq('locale', locale)
    .in('project_id', projectIds);

  if (translationError) {
    if (isMissingProjectShadowSchemaError(translationError.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] shadow 상세 목록 번역 조회 실패: ${translationError.message}`);
  }

  const translationMap = new Map(
    ((translationRows ?? []) as ProjectDetailTranslationRow[]).map(row => [row.project_id, row]),
  );

  return {
    data: toProjectDetailListItems(
      baseRows.flatMap(row => {
        const translation = translationMap.get(row.id);
        if (!translation) return [];

        return [
          {
            created_at: row.created_at,
            description: translation.description,
            id: row.id,
            title: translation.title,
          } satisfies ProjectDetailListItem,
        ];
      }),
    ),
    schemaMissing: false,
  };
};

/**
 * shadow schema를 우선 사용하고, 미배포 환경에서는 기존 locale row 스키마로 fallback합니다.
 */
const fetchProjectDetailListByLocale = async (
  locale: string,
): Promise<{ data: ProjectDetailListItem[]; localeColumnMissing: boolean }> => {
  const shadowList = await fetchProjectDetailListFromShadow(locale);
  if (!shadowList.schemaMissing) {
    return {
      data: shadowList.data,
      localeColumnMissing: false,
    };
  }

  return fetchProjectDetailListByLocaleLegacy(locale);
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 프로젝트 요약 목록을 조회합니다.
 */
const fetchProjectDetailListLegacy = async (): Promise<ProjectDetailListItem[]> => {
  const query = createProjectDetailListQuery();
  if (!query) return [];

  const { data, error } = await query.limit(DETAIL_LIST_LIMIT + 1);

  if (error) {
    throw new Error(`[projects] 상세 목록 legacy 조회 실패: ${error.message}`);
  }

  return toProjectDetailListItems((data ?? []) as ProjectDetailListItem[]);
};

/**
 * 프로젝트 상세 좌측 아카이브 목록을 가져옵니다.
 *
 * 현재 UI는 첫 페이지만 사용하지만, 조회 자체는 keyset 정렬 기준으로 통일합니다.
 */
export const getProjectDetailList = async (locale: string): Promise<ProjectDetailListItem[]> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return [];

  const normalizedLocale = locale.toLowerCase();
  const getCachedProjectDetailList = unstable_cache(
    async () =>
      resolveLocaleAwareData<ProjectDetailListItem[]>({
        emptyData: [],
        fallbackLocale: 'ko',
        fetchByLocale: targetLocale => fetchProjectDetailListByLocale(targetLocale),
        fetchLegacy: fetchProjectDetailListLegacy,
        isEmptyData: items => items.length === 0,
        targetLocale: normalizedLocale,
      }),
    ['projects', 'detail-list', cacheScope, normalizedLocale, 'keyset'],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjectDetailList();
};
