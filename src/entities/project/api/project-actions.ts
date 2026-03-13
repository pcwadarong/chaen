'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import type { ProjectArchivePage, ProjectListPage } from '@/entities/project/model/types';
import { locales } from '@/i18n/routing';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import { getProjectDetailList } from './get-project-detail-list';
import { getProjects } from './get-projects';

const projectFeedPageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const projectArchivePageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const deleteProjectSchema = z.object({
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
  projectId: z.string().trim().min(1, '대상 프로젝트를 확인할 수 없습니다.'),
  projectSlug: z.string().trim().min(1, '대상 프로젝트 경로를 확인할 수 없습니다.'),
});

const PROJECT_ACTION_ERROR_MESSAGE = {
  archiveFetchFailed: 'project.archiveFetchFailed',
  deleteFailed: 'project.deleteFailed',
  listFetchFailed: 'project.listFetchFailed',
} as const;

/**
 * 프로젝트 목록 무한 스크롤용 페이지를 반환합니다.
 */
export const getProjectsPageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ProjectListPage>> => {
  const validation = validateActionInput(projectFeedPageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getProjects({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(
      PROJECT_ACTION_ERROR_MESSAGE.listFetchFailed,
      PROJECT_ACTION_ERROR_MESSAGE.listFetchFailed,
    );
  }
};

/**
 * 프로젝트 상세 좌측 아카이브 추가 로드 페이지를 반환합니다.
 */
export const getProjectDetailArchivePageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ProjectArchivePage>> => {
  const validation = validateActionInput(projectArchivePageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getProjectDetailList({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(
      PROJECT_ACTION_ERROR_MESSAGE.archiveFetchFailed,
      PROJECT_ACTION_ERROR_MESSAGE.archiveFetchFailed,
    );
  }
};

/**
 * 관리자만 공개 프로젝트를 삭제하고 목록으로 이동합니다.
 */
export const deleteProjectAction = async (input: {
  locale: string;
  projectId: string;
  projectSlug: string;
}) => {
  const validation = validateActionInput(deleteProjectSchema, input);

  if (!validation.ok) {
    throw new Error(validation.errorMessage);
  }

  await requireAdmin({ locale: validation.data.locale, onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error(PROJECT_ACTION_ERROR_MESSAGE.deleteFailed);
  }

  const { locale, projectId, projectSlug } = validation.data;

  const { error: tagsError } = await supabase
    .from('project_tags')
    .delete()
    .eq('project_id', projectId);
  if (tagsError) throw new Error(PROJECT_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: translationsError } = await supabase
    .from('project_translations')
    .delete()
    .eq('project_id', projectId);
  if (translationsError) throw new Error(PROJECT_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: draftsError } = await supabase
    .from('drafts')
    .delete()
    .eq('content_type', 'project')
    .eq('content_id', projectId);
  if (draftsError) throw new Error(PROJECT_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId);
  if (projectError) throw new Error(PROJECT_ACTION_ERROR_MESSAGE.deleteFailed);

  revalidateProjectPublicPaths(projectSlug);
  revalidateTag(PROJECTS_CACHE_TAG);
  revalidateTag(createProjectCacheTag(projectId));

  redirect(
    buildLocalizedPathname({
      locale: locale as (typeof locales)[number],
      pathname: '/project',
    }),
  );
};

const revalidateProjectPublicPaths = (projectSlug: string) => {
  locales.forEach(locale => {
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/project',
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: `/project/${projectSlug}`,
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/',
      }),
    );
  });
};
