import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  mapProject,
  mapProjectFallbackRpcRow,
  type ProjectTranslationFallbackRpcRow,
} from '@/entities/project/api/shared/map-project-translation';
import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import type { Project } from '@/entities/project/model/types';
import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
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
  if (code) return code === '42883' || code === '42P01' || code === 'PGRST202';

  const normalizedMessage = message.toLowerCase();
  const hasMissingObjectText = normalizedMessage.includes('does not exist');
  const missingProjectTranslationsRelationPattern =
    /relation\s+["']?(?:public\.)?project_translations["']?\s+does not exist/i;
  const missingProjectsRelationPattern =
    /relation\s+["']?(?:public\.)?projects["']?\s+does not exist/i;
  const missingProjectFallbackFunctionPattern = /get_project_translation_with_fallback/i;

  return (
    (hasMissingObjectText && missingProjectFallbackFunctionPattern.test(normalizedMessage)) ||
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
 * content schema RPC에서 fallback 우선순위가 반영된 단일 프로젝트 번역을 조회합니다.
 */
const fetchProjectFromContentSchema = async (
  projectId: string,
  localeFallbackChain: string[],
): Promise<{ data: ResolvedProject; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: {
        item: null,
        resolvedLocale: null,
      },
      schemaMissing: false,
    };
  }

  const { data: translationRows, error: translationError } = await supabase.rpc(
    'get_project_translation_with_fallback',
    {
      fallback_locales: localeFallbackChain,
      target_project_id: projectId,
    },
  );

  if (translationError) {
    if (isMissingProjectContentSchemaError(translationError)) {
      return {
        data: {
          item: null,
          resolvedLocale: null,
        },
        schemaMissing: true,
      };
    }

    throw new Error(`[projects] 번역 조회 실패: ${translationError.message}`);
  }

  const translation = (translationRows ?? [])[0] as ProjectTranslationFallbackRpcRow | undefined;
  if (!translation) {
    return {
      data: {
        item: null,
        resolvedLocale: null,
      },
      schemaMissing: false,
    };
  }

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'project_id',
    entityId: projectId,
    relationTable: 'project_tags',
  });

  return {
    data: {
      item: mapProject(
        mapProjectFallbackRpcRow(translation),
        relatedTags.schemaMissing ? [] : relatedTags.data,
      ),
      resolvedLocale: translation.locale.toLowerCase(),
    },
    schemaMissing: false,
  };
};

/**
 * locale fallback 체인으로 단일 프로젝트를 조회합니다.
 */
const fetchProjectByLocaleFallbackChain = async (
  projectId: string,
  localeFallbackChain: string[],
): Promise<ResolvedProject> => {
  const resolvedProjectResult = await fetchProjectFromContentSchema(projectId, localeFallbackChain);
  if (resolvedProjectResult.schemaMissing) {
    throw new Error('[projects] content schema가 없습니다.');
  }

  return resolvedProjectResult.data;
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
  const resolvedProject = await fetchProjectByLocaleFallbackChain(
    resolvedProjectId,
    buildContentLocaleFallbackChain(normalizedLocale),
  );

  cacheTag(PROJECTS_CACHE_TAG, createProjectCacheTag(resolvedProjectId));

  return {
    item: resolvedProject.item,
    resolvedLocale: resolvedProject.resolvedLocale,
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
