import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { ProjectDetailListItem } from '../model/types';

import { mapProjectDetailListItems, type ProjectTranslationRow } from './map-project-translation';

const DETAIL_LIST_LIMIT = 200;

const isMissingProjectContentSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('projects') || normalizedMessage.includes('project_translations')
  );
};

/**
 * content schema(`projects` + `project_translations`) 기준 상세 아카이브 목록을 조회합니다.
 */
const fetchProjectDetailListFromContentSchema = async (
  locale: string,
): Promise<{ data: ProjectDetailListItem[]; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data: translationRows, error: translationError } = await supabase
    .from('project_translations')
    .select('project_id,title,description,projects!inner(created_at)')
    .eq('locale', locale)
    .order('created_at', { ascending: false, referencedTable: 'projects' })
    .order('project_id', { ascending: false })
    .limit(DETAIL_LIST_LIMIT);

  if (translationError) {
    if (isMissingProjectContentSchemaError(translationError.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[projects] 상세 목록 번역 조회 실패: ${translationError.message}`);
  }

  return {
    data: mapProjectDetailListItems((translationRows ?? []) as ProjectTranslationRow[]),
    schemaMissing: false,
  };
};

const fetchProjectDetailListByLocale = async (locale: string): Promise<ProjectDetailListItem[]> => {
  const projectDetailList = await fetchProjectDetailListFromContentSchema(locale);
  if (projectDetailList.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  return projectDetailList.data;
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
    async () => {
      const localizedItems = await fetchProjectDetailListByLocale(normalizedLocale);
      if (localizedItems.length > 0 || normalizedLocale === 'ko') return localizedItems;

      return fetchProjectDetailListByLocale('ko');
    },
    ['projects', 'detail-list', cacheScope, normalizedLocale, 'keyset'],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjectDetailList();
};
