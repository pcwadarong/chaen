import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import {
  buildContentLocaleFallbackChain,
  resolveFirstAvailableLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '../model/cache-tags';
import type { Project } from '../model/types';

import { mapProject, type ProjectTranslationRow } from './map-project-translation';

type ProjectContentSchemaError = {
  code?: string | null;
  message: string;
};

const isMissingProjectContentSchemaError = ({ code, message }: ProjectContentSchemaError) => {
  if (code) return code === '42P01';

  const normalizedMessage = message.toLowerCase();
  // 프로젝트 content schema는 `projects` 테이블과 `project_translations` 테이블로 구성되어 있어서 둘 중 하나라도 없으면 조회가 불가능합니다.
  const missingProjectTranslationsRelationPattern =
    /relation\s+["']?(?:public\.)?project_translations["']?\s+does not exist/i;
  const missingProjectsRelationPattern =
    /relation\s+["']?(?:public\.)?projects["']?\s+does not exist/i;

  return (
    missingProjectTranslationsRelationPattern.test(normalizedMessage) ||
    missingProjectsRelationPattern.test(normalizedMessage)
  );
};

/**
 * content schema(`projects` + `project_translations`)에서 locale별 단일 프로젝트를 조회합니다.
 */
const fetchProjectFromContentSchema = async (
  projectId: string,
  locale: string,
): Promise<{ data: Project | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data: translation, error: translationError } = await supabase
    .from('project_translations')
    .select(
      'project_id,title,description,content,projects!inner(id,thumbnail_url,created_at,period_start,period_end)',
    )
    .eq('project_id', projectId)
    .eq('locale', locale)
    .maybeSingle<ProjectTranslationRow>();

  if (translationError) {
    if (isMissingProjectContentSchemaError(translationError))
      return { data: null, schemaMissing: true };

    throw new Error(`[projects] 번역 조회 실패: ${translationError.message}`);
  }

  if (!translation) return { data: null, schemaMissing: false };

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'project_id',
    entityId: projectId,
    relationTable: 'project_tags',
  });
  if (relatedTags.schemaMissing) throw new Error('[projects] 태그 relation schema가 없습니다.');

  return {
    data: mapProject(translation, relatedTags.data),
    schemaMissing: false,
  };
};

const fetchProjectByLocale = async (projectId: string, locale: string): Promise<Project | null> => {
  const projectResult = await fetchProjectFromContentSchema(projectId, locale);
  if (projectResult.schemaMissing) throw new Error('[projects] content schema가 없습니다.');

  return projectResult.data;
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
      const project = await resolveFirstAvailableLocaleValue({
        fetchByLocale: locale => fetchProjectByLocale(projectId, locale),
        hasValue: value => Boolean(value),
        locales: buildContentLocaleFallbackChain(normalizedLocale),
      });

      return project;
    },
    ['project', cacheScope, projectId, normalizedLocale],
    {
      tags: [PROJECTS_CACHE_TAG, createProjectCacheTag(projectId)],
      revalidate: false,
    },
  );

  return getCachedProject();
};
