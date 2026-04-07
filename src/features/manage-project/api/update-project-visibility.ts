'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import { buildAdminSubPath } from '@/features/admin-session/model/admin-path';
import { locales } from '@/i18n/routing';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const projectSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/)
  .optional();

const updateProjectVisibilitySchema = z.object({
  projectId: z.string().trim().min(1, '대상 프로젝트를 확인할 수 없습니다.'),
  projectSlug: projectSlugSchema,
  visibility: z.enum(['private', 'public']),
});

const PROJECT_VISIBILITY_UPDATE_FAILED = 'project.visibilityUpdateFailed';

/**
 * 프로젝트 공개 상태 변경 이후 관리자/공개 경로를 다시 검증합니다.
 */
const revalidateProjectVisibilityPaths = ({ projectSlug }: { projectSlug?: string }) => {
  revalidatePath(buildAdminSubPath('/content'));

  locales.forEach(itemLocale => {
    revalidatePath(
      buildLocalizedPathname({
        locale: itemLocale,
        pathname: '/project',
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale: itemLocale,
        pathname: '/',
      }),
    );

    if (projectSlug) {
      revalidatePath(
        buildLocalizedPathname({
          locale: itemLocale,
          pathname: `/project/${projectSlug}`,
        }),
      );
    }
  });
};

/**
 * 관리자가 프로젝트 공개 상태를 즉시 전환합니다.
 */
export const updateProjectVisibilityAction = async (input: {
  projectId: string;
  projectSlug?: string;
  visibility: 'private' | 'public';
}) => {
  const validation = validateActionInput(updateProjectVisibilitySchema, input);

  if (!validation.ok) throw new Error(validation.errorMessage);

  const { projectId, projectSlug, visibility } = validation.data;

  await requireAdmin({ onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error(PROJECT_VISIBILITY_UPDATE_FAILED);

  const { error } = await supabase.from('projects').update({ visibility }).eq('id', projectId);

  if (error) throw new Error(PROJECT_VISIBILITY_UPDATE_FAILED);

  revalidateTag(PROJECTS_CACHE_TAG);
  revalidateTag(createProjectCacheTag(projectId));
  revalidateProjectVisibilityPaths({ projectSlug });
};
