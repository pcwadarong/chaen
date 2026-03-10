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

type SignInAdminActionData = null;

const signInAdminSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().trim().min(1, '비밀번호를 입력해주세요.'),
  redirectPath: z
    .string()
    .trim()
    .min(1)
    .refine(value => value.startsWith('/'), '이동 경로가 올바르지 않습니다.'),
});

/**
 * 관리자 로그인 action의 초기 상태입니다.
 */
export const initialSignInAdminState = createInitialActionResult<SignInAdminActionData>();

/**
 * 관리자 로그인 폼을 처리하고 성공 시 지정한 경로로 이동합니다.
 */
export const signInAdmin = async (
  _previousState: ActionResult<SignInAdminActionData>,
  formData: FormData,
): Promise<ActionResult<SignInAdminActionData>> => {
  const validation = validateActionInput(signInAdminSchema, Object.fromEntries(formData.entries()));

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  const { email, password, redirectPath } = validation.data;
  const authState = await getServerAuthState();
  if (authState.isAdmin) redirect(redirectPath);

  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return createActionFailure('이메일 또는 비밀번호를 다시 확인해주세요.');
    }

    return createActionFailure('로그인 처리 중 문제가 발생했습니다.');
  }

  if (!session) {
    return createActionFailure('로그인 처리 중 문제가 발생했습니다.');
  }

  redirect(redirectPath);
};
