import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

/**
 * locale 컬럼을 사용하는 프로젝트 목록 조회입니다.
 */
const fetchProjectsByLocale = async (
  locale: string,
): Promise<{ data: Project[]; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], localeColumnMissing: false };

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('locale', locale)
    .order('created_at', { ascending: false });

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[projects] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: dedupeById((data ?? []) as Project[]),
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 프로젝트 목록 조회입니다.
 */
const fetchProjectsLegacy = async (): Promise<Project[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`[projects] 목록 조회 실패: ${error.message}`);
  }

  return dedupeById((data ?? []) as Project[]);
};

/**
 * 프로젝트 목록 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('projects')`로 즉시 갱신할 수 있습니다.
 */
export const getProjects = async (targetLocale: string): Promise<Project[]> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return [];

  const normalizedLocale = targetLocale.toLowerCase();
  const getCachedProjects = unstable_cache(
    async () =>
      resolveLocaleAwareData<Project[]>({
        emptyData: [],
        fallbackLocale: 'ko',
        fetchByLocale: fetchProjectsByLocale,
        fetchLegacy: fetchProjectsLegacy,
        isEmptyData: items => items.length === 0,
        targetLocale: normalizedLocale,
      }),
    ['projects', 'list', cacheScope, normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjects();
};
