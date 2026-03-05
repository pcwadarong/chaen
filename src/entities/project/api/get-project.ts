import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

/**
 * locale 컬럼을 사용하는 프로젝트를 조회합니다.
 */
const fetchProjectByLocale = async (
  projectId: string,
  locale: string,
): Promise<{ data: Project | null; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, localeColumnMissing: false };

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('locale', locale)
    .maybeSingle<Project>();

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: null,
        localeColumnMissing: true,
      };
    }

    throw new Error(`[projects] locale 조회 실패: ${error.message}`);
  }

  return {
    data,
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 단일 프로젝트 조회입니다.
 */
const fetchProjectLegacy = async (projectId: string): Promise<Project | null> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle<Project>();

  if (error) {
    throw new Error(`[projects] 단일 조회 실패: ${error.message}`);
  }

  return data;
};

/**
 * 프로젝트 상세 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('projects')` 또는 `revalidateTag('project:{id}')`로 즉시 갱신할 수 있습니다.
 */
export const getProject = async (
  projectId: string,
  targetLocale: string,
): Promise<Project | null> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return null;

  const normalizedLocale = targetLocale.toLowerCase();
  const getCachedProject = unstable_cache(
    async () =>
      resolveLocaleAwareData<Project | null>({
        emptyData: null,
        fallbackLocale: 'ko',
        fetchByLocale: locale => fetchProjectByLocale(projectId, locale),
        fetchLegacy: () => fetchProjectLegacy(projectId),
        isEmptyData: item => item === null,
        targetLocale: normalizedLocale,
      }),
    ['project', cacheScope, projectId, normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG, createProjectCacheTag(projectId)],
      revalidate: false,
    },
  );

  return getCachedProject();
};
