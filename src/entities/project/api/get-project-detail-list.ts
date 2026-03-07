import { unstable_cache } from 'next/cache';

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

/**
 * 프로젝트 상세 아카이브용 요약 목록을 정규화합니다.
 */
const toProjectDetailListItems = (rows: ProjectDetailListItem[]): ProjectDetailListItem[] =>
  rows.map(({ created_at, description, id, title }) => ({
    created_at,
    description,
    id,
    title,
  }));

/**
 * locale 컬럼을 사용하는 프로젝트 요약 목록을 조회합니다.
 */
const fetchProjectDetailListByLocale = async (
  locale: string,
): Promise<{ data: ProjectDetailListItem[]; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      localeColumnMissing: false,
    };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id,title,description,created_at')
    .eq('locale', locale)
    .order('created_at', { ascending: false })
    .range(0, DETAIL_LIST_LIMIT - 1);

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
 * locale 컬럼이 없는 기존 스키마를 위한 프로젝트 요약 목록을 조회합니다.
 */
const fetchProjectDetailListLegacy = async (): Promise<ProjectDetailListItem[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id,title,description,created_at')
    .order('created_at', { ascending: false })
    .range(0, DETAIL_LIST_LIMIT - 1);

  if (error) {
    throw new Error(`[projects] 상세 목록 legacy 조회 실패: ${error.message}`);
  }

  return toProjectDetailListItems((data ?? []) as ProjectDetailListItem[]);
};

/**
 * 프로젝트 상세 좌측 아카이브 목록을 가져옵니다.
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
    ['projects', 'detail-list', cacheScope, normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjectDetailList();
};
