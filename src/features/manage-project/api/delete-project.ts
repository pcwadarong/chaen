'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import { ADMIN_LOCALE } from '@/features/admin-session/model/admin-path';
import { locales } from '@/i18n/routing';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const deleteProjectSchema = z.object({
  projectId: z.string().trim().min(1, '대상 프로젝트를 확인할 수 없습니다.'),
  projectSlug: z.string().trim().min(1, '대상 프로젝트 경로를 확인할 수 없습니다.'),
});

const PROJECT_DELETE_FAILED = 'project.deleteFailed';

/**
 * locale별 공개 프로젝트 경로와 홈 노출 경로를 다시 검증합니다.
 */
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

/**
 * 관리자만 공개 프로젝트를 삭제하고 목록으로 이동합니다.
 */
export const deleteProjectAction = async (input: { projectId: string; projectSlug: string }) => {
  const validation = validateActionInput(deleteProjectSchema, input);

  if (!validation.ok) {
    throw new Error(validation.errorMessage);
  }

  await requireAdmin({ onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error(PROJECT_DELETE_FAILED);
  }

  const { projectId, projectSlug } = validation.data;
  const { error: deleteError } = await supabase.rpc('delete_project_with_dependents', {
    target_project_id: projectId,
  });

  if (deleteError) {
    throw new Error(PROJECT_DELETE_FAILED);
  }

  revalidateProjectPublicPaths(projectSlug);
  revalidateTag(PROJECTS_CACHE_TAG);
  revalidateTag(createProjectCacheTag(projectId));

  redirect(
    buildLocalizedPathname({
      locale: ADMIN_LOCALE,
      pathname: '/project',
    }),
  );
};
