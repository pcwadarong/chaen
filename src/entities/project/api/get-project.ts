import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

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

/**
 * locale 컬럼을 사용하는 프로젝트를 조회합니다.
 */
const fetchProjectByLocaleLegacy = async (
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

  if (!data) {
    return {
      data,
      localeColumnMissing: false,
    };
  }

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'project_id',
    entityId: projectId,
    locale,
    relationTable: 'project_tags',
  });

  return {
    data: relatedTags.schemaMissing ? data : { ...data, tags: relatedTags.data },
    localeColumnMissing: false,
  };
};

/**
 * shadow schema를 우선 사용하고, 미배포 환경에서는 기존 locale row 스키마로 fallback합니다.
 */
const fetchProjectByLocale = async (
  projectId: string,
  locale: string,
): Promise<{ data: Project | null; localeColumnMissing: boolean }> => {
  const shadowProject = await fetchProjectFromShadowSchema(projectId, locale);
  if (!shadowProject.schemaMissing) {
    return {
      data: shadowProject.data,
      localeColumnMissing: false,
    };
  }

  return fetchProjectByLocaleLegacy(projectId, locale);
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
