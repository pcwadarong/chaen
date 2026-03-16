'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isSafeRedirectPath } from '@/features/auth/api/is-safe-redirect-path';
import { AUTH_ACTION_ERROR_CODE } from '@/features/auth/model/auth-action-error';
import { type ActionResult, createActionFailure } from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

const signOutAdminSchema = z.object({
  redirectPath: z
    .string()
    .trim()
    .min(1)
    .refine(isSafeRedirectPath, '이동 경로가 올바르지 않습니다.'),
});

/**
 * 관리자 세션을 종료하고 지정한 경로로 이동합니다.
 */
export const signOutAdmin = async (
  _previousState: ActionResult<null>,
  formData: FormData,
): Promise<ActionResult<null>> => {
  const validation = validateActionInput(
    signOutAdminSchema,
    Object.fromEntries(formData.entries()),
  );

  if (!validation.ok) return createActionFailure(validation.errorMessage);

  const { redirectPath } = validation.data;
  await getServerAuthState();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return createActionFailure('로그아웃에 실패했습니다.', AUTH_ACTION_ERROR_CODE.signOutFailed);
  }

  redirect(redirectPath);
};
