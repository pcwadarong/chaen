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

const updateProjectDisplayOrderSchema = z.object({
  orderedProjectIds: z.array(z.string().trim().min(1)).min(1, '대상 프로젝트가 없습니다.'),
});

/**
 * 프로젝트 정렬 변경 후 관리자/공개 경로를 다시 검증합니다.
 */
const revalidateProjectOrderPaths = () => {
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
  });
};

/**
 * 관리자가 전달한 프로젝트 배열 순서대로 `display_order`를 다시 저장합니다.
 */
export const updateProjectDisplayOrderAction = async (input: { orderedProjectIds: string[] }) => {
  const validation = validateActionInput(updateProjectDisplayOrderSchema, input);

  if (!validation.ok) throw new Error(validation.errorMessage);

  const { orderedProjectIds } = validation.data;

  await requireAdmin({ onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('project.orderUpdateFailed');

  if (new Set(orderedProjectIds).size !== orderedProjectIds.length) {
    throw new Error('project.invalidOrderRequest');
  }

  const { data: existingProjects, error: fetchError } = await supabase
    .from('projects')
    .select('id')
    .in('id', orderedProjectIds);

  if (fetchError) throw new Error('project.orderUpdateFailed');

  const existingProjectIdSet = new Set((existingProjects ?? []).map(project => project.id));
  const validatedProjectIds = orderedProjectIds.filter(projectId =>
    existingProjectIdSet.has(projectId),
  );

  if (validatedProjectIds.length !== orderedProjectIds.length) {
    throw new Error('project.invalidOrderRequest');
  }

  const { error } = await supabase.from('projects').upsert(
    validatedProjectIds.map((id, index) => ({
      id,
      display_order: index + 1,
    })),
    { onConflict: 'id' },
  );

  if (error) throw new Error('project.orderUpdateFailed');

  revalidateTag(PROJECTS_CACHE_TAG);
  validatedProjectIds.forEach(projectId => {
    revalidateTag(createProjectCacheTag(projectId));
  });
  revalidateProjectOrderPaths();
};
