'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  type ActionResult,
  createActionFailure,
  createInitialActionResult,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

type SignOutAdminActionData = null;

const signOutAdminSchema = z.object({
  redirectPath: z
    .string()
    .trim()
    .min(1)
    .refine(value => value.startsWith('/'), '이동 경로가 올바르지 않습니다.'),
});

/**
 * 관리자 로그아웃 action의 초기 상태입니다.
 */
export const initialSignOutAdminState = createInitialActionResult<SignOutAdminActionData>();

/**
 * 관리자 세션을 종료하고 지정한 경로로 이동합니다.
 */
export const signOutAdmin = async (
  _previousState: ActionResult<SignOutAdminActionData>,
  formData: FormData,
): Promise<ActionResult<SignOutAdminActionData>> => {
  const validation = validateActionInput(
    signOutAdminSchema,
    Object.fromEntries(formData.entries()),
  );

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  const { redirectPath } = validation.data;
  await getServerAuthState();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return createActionFailure('로그아웃에 실패했습니다.');
  }

  redirect(redirectPath);
};
