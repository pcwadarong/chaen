import { unstable_cache } from 'next/cache';

import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

/**
 * 같은 id가 중복된 경우(created_at 역순 기준) 첫 레코드만 유지합니다.
 */
const dedupeProjectsById = (items: Project[]): Project[] => {
  const seen = new Set<string>();
  const deduped: Project[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
};

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
    const isLocaleColumnMissing = /column .*locale.* does not exist/i.test(error.message);
    if (isLocaleColumnMissing) {
      return {
        data: [],
        localeColumnMissing: true,
      };
    }

    throw new Error(`[projects] locale 목록 조회 실패: ${error.message}`);
  }

  return {
    data: dedupeProjectsById((data ?? []) as Project[]),
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

  return dedupeProjectsById((data ?? []) as Project[]);
};

/**
 * 프로젝트 목록 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('projects')`로 즉시 갱신할 수 있습니다.
 */
export const getProjects = async (targetLocale: string): Promise<Project[]> => {
  const normalizedLocale = targetLocale.toLowerCase();
  const getCachedProjects = unstable_cache(
    async () => {
      const localizedResult = await fetchProjectsByLocale(normalizedLocale);
      if (localizedResult.localeColumnMissing) return fetchProjectsLegacy();

      if (localizedResult.data.length > 0) return localizedResult.data;

      if (normalizedLocale !== 'en') {
        const fallbackResult = await fetchProjectsByLocale('en');
        if (fallbackResult.localeColumnMissing) return fetchProjectsLegacy();

        if (fallbackResult.data.length > 0) return fallbackResult.data;
      }

      return [];
    },
    ['projects', 'list', normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedProjects();
};
