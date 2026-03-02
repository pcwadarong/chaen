import { unstable_cache } from 'next/cache';

import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

/**
 * 프로젝트 목록을 Supabase에서 생성일 역순으로 조회합니다.
 */
const fetchProjects = async (): Promise<Project[]> => {
  const supabase = createPublicServerSupabaseClient();
  const { data, error } = await supabase.from('projects').select('*').order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(`[projects] 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Project[];
};

/**
 * 프로젝트 목록 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('projects')`로 즉시 갱신할 수 있습니다.
 */
export const getProjects = async (): Promise<Project[]> => {
  const getCachedProjects = unstable_cache(fetchProjects, ['projects', 'list'], {
    tags: [PROJECTS_CACHE_TAG],
    revalidate: false,
  });

  return getCachedProjects();
};
