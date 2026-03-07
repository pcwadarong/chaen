import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

const isMissingProjectShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('projects_v2') || normalizedMessage.includes('project_translations')
  );
};

type ProjectBaseRow = Pick<
  Project,
  'created_at' | 'id' | 'period_end' | 'period_start' | 'thumbnail_url'
>;

type ProjectTranslationRow = Pick<Project, 'content' | 'description' | 'title'> & {
  project_id: string;
};

/**
 * shadow schema(`projects_v2` + `project_translations`)에서 locale별 단일 프로젝트를 조회합니다.
 */
const fetchProjectFromShadowSchema = async (
  projectId: string,
  locale: string,
): Promise<{ data: Project | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data: translation, error: translationError } = await supabase
    .from('project_translations')
    .select('project_id,title,description,content')
    .eq('project_id', projectId)
    .eq('locale', locale)
    .maybeSingle<ProjectTranslationRow>();

  if (translationError) {
    if (isMissingProjectShadowSchemaError(translationError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[projects] shadow 번역 조회 실패: ${translationError.message}`);
  }

  if (!translation) {
    return { data: null, schemaMissing: false };
  }

  const { data: projectBase, error: projectBaseError } = await supabase
    .from('projects_v2')
    .select('id,thumbnail_url,created_at,period_start,period_end')
    .eq('id', projectId)
    .maybeSingle<ProjectBaseRow>();

  if (projectBaseError) {
    if (isMissingProjectShadowSchemaError(projectBaseError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[projects] shadow base 조회 실패: ${projectBaseError.message}`);
  }

  if (!projectBase) {
    return { data: null, schemaMissing: false };
  }

  const shadowTags = await getRelatedTagSlugs({
    entityColumn: 'project_id',
    entityId: projectId,
    relationTable: 'project_tags_v2',
  });

  const legacyTags = shadowTags.schemaMissing
    ? await getRelatedTagSlugs({
        entityColumn: 'project_id',
        entityId: projectId,
        locale,
        relationTable: 'project_tags',
      })
    : shadowTags;

  return {
    data: {
      ...projectBase,
      ...translation,
      gallery_urls: null,
      tags: legacyTags.schemaMissing ? null : legacyTags.data,
    },
    schemaMissing: false,
  };
};

const fetchProjectByLocale = async (projectId: string, locale: string): Promise<Project | null> => {
  const shadowProject = await fetchProjectFromShadowSchema(projectId, locale);
  if (shadowProject.schemaMissing) {
    throw new Error('[projects] shadow content schema가 없습니다.');
  }

  return shadowProject.data;
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
    async () => {
      const localizedProject = await fetchProjectByLocale(projectId, normalizedLocale);
      if (localizedProject || normalizedLocale === 'ko') return localizedProject;

      return fetchProjectByLocale(projectId, 'ko');
    },
    ['project', cacheScope, projectId, normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG, createProjectCacheTag(projectId)],
      revalidate: false,
    },
  );

  return getCachedProject();
};
