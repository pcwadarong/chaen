import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  mapProject,
  type ProjectTranslationRow,
} from '@/entities/project/api/shared/map-project-translation';
import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import type { Project } from '@/entities/project/model/types';
import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
import { resolveFirstAvailableLocaleEntry } from '@/shared/lib/i18n/resolved-locale';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type ResolvedProject = {
  item: Project | null;
  resolvedLocale: string | null;
};

type ProjectLookup = {
  id: string;
};

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
 * 공개 상세 경로로 들어온 slug를 내부 project id로 해석합니다.
 *
 * @param projectSlug - 주소창에서 받은 공개 slug
 * @returns 내부 project id와 slug 정보
 */
const resolveProjectLookup = async (
  projectSlug: string,
): Promise<{ data: ProjectLookup | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const projectSlugQuery = supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .eq('visibility', 'public')
    .lte('publish_at', new Date().toISOString())
    .not('publish_at', 'is', null)
    .maybeSingle<ProjectLookup>();
  const { data: projectBySlug, error: projectBySlugError } = await projectSlugQuery;

  if (projectBySlugError) {
    if (isMissingProjectContentSchemaError(projectBySlugError)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[projects] slug 조회 실패: ${projectBySlugError.message}`);
  }

  return {
    data: projectBySlug ?? null,
    schemaMissing: false,
  };
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
      'project_id,title,description,content,projects!inner(id,thumbnail_url,created_at,period_start,period_end,slug,visibility,allow_comments,publish_at)',
    )
    .eq('project_id', projectId)
    .eq('locale', locale)
    .eq('projects.visibility', 'public')
    .lte('projects.publish_at', new Date().toISOString())
    .not('projects.publish_at', 'is', null)
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
 * 단일 프로젝트 조회 결과를 `use cache`로 캐시합니다.
 */
const readCachedProject = async (
  projectSlug: string,
  normalizedLocale: string,
): Promise<ResolvedProject> => {
  'use cache';

  const projectLookup = await resolveProjectLookup(projectSlug);
  if (projectLookup.schemaMissing) throw new Error('[projects] content schema가 없습니다.');
  if (!projectLookup.data) {
    cacheTag(PROJECTS_CACHE_TAG);

    return {
      item: null,
      resolvedLocale: null,
    };
  }

  const resolvedProjectId = projectLookup.data.id;
  const resolvedProject = await resolveFirstAvailableLocaleEntry({
    fetchByLocale: locale => fetchProjectByLocale(resolvedProjectId, locale),
    hasValue: value => Boolean(value),
    locales: buildContentLocaleFallbackChain(normalizedLocale),
  });

  cacheTag(PROJECTS_CACHE_TAG, createProjectCacheTag(resolvedProjectId));

  return {
    item: resolvedProject?.value ?? null,
    resolvedLocale: resolvedProject?.locale ?? null,
  };
};

/**
 * 프로젝트와 실제 선택된 locale을 함께 반환합니다.
 */
export const getResolvedProject = async (
  projectSlug: string,
  targetLocale: string,
): Promise<ResolvedProject> => {
  if (!hasSupabaseEnv()) {
    return {
      item: null,
      resolvedLocale: null,
    };
  }

  const normalizedLocale = targetLocale.toLowerCase();

  return readCachedProject(projectSlug, normalizedLocale);
};

/**
 * 프로젝트 상세 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('projects')` 또는 `revalidateTag('project:{id}')`로 즉시 갱신할 수 있습니다.
 */
export const getProject = async (
  projectSlug: string,
  targetLocale: string,
): Promise<Project | null> => {
  const result = await getResolvedProject(projectSlug, targetLocale);
  return result.item;
};
