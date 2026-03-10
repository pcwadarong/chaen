'use server';

import { z } from 'zod';

import {
  createGuestbookEntry,
  deleteGuestbookEntry,
  getGuestbookThreads,
  updateGuestbookEntry,
  verifyGuestbookSecret,
} from '@/entities/guestbook';
import { revalidateGuestbookCache } from '@/entities/guestbook/lib/revalidate-guestbook-cache';
import type { GuestbookEntry, GuestbookThreadPage } from '@/entities/guestbook/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
  createInitialActionResult,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { normalizeCommentComposePassword } from '@/shared/lib/comment-compose';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

type GuestbookSubmitActionData = {
  entry: GuestbookEntry;
};

type GuestbookVerifyActionData = {
  entry: GuestbookEntry;
};

const createGuestbookEntrySchema = z.object({
  authorBlogUrl: z
    .string()
    .optional()
    .transform(value => value?.trim() ?? '')
    .refine(value => !value || Boolean(normalizeHttpUrl(value)), {
      message: '홈페이지 주소를 다시 확인해주세요.',
    }),
  authorName: z
    .string()
    .optional()
    .transform(value => value?.trim() ?? ''),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(3000, '내용은 3000자 이하로 입력해주세요.'),
  isSecret: z.preprocess(value => value === 'on' || value === 'true', z.boolean()),
  parentId: z
    .string()
    .optional()
    .transform(value => value?.trim() || null),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? '')),
});

const verifyGuestbookSecretSchema = z.object({
  entryId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  password: z
    .string()
    .transform(value => normalizeCommentComposePassword(value))
    .pipe(z.string().min(4, '비밀번호를 입력해주세요.')),
});

const updateGuestbookEntrySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(3000, '내용은 3000자 이하로 입력해주세요.'),
  entryId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? '')),
});

const deleteGuestbookEntrySchema = z.object({
  entryId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? '')),
});

const guestbookThreadsPageSchema = z.object({
  cursor: z
    .string()
    .optional()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
});

/**
 * 방명록 작성 action의 초기 상태입니다.
 */
export const initialSubmitGuestbookEntryState =
  createInitialActionResult<GuestbookSubmitActionData>();

/**
 * 비밀글 확인 action의 초기 상태입니다.
 */
export const initialVerifyGuestbookSecretState =
  createInitialActionResult<GuestbookVerifyActionData>();

/**
 * 방명록 글/답글 작성 폼을 처리합니다.
 */
export const submitGuestbookEntry = async (
  _previousState: ActionResult<GuestbookSubmitActionData>,
  formData: FormData,
): Promise<ActionResult<GuestbookSubmitActionData>> => {
  const validation = validateActionInput(
    createGuestbookEntrySchema,
    Object.fromEntries(formData.entries()),
  );

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  const { authorBlogUrl, authorName, content, isSecret, parentId, password } = validation.data;

  try {
    const authState = await getServerAuthState();

    if (!authState.isAdmin && !authorName) {
      return createActionFailure('이름을 입력해주세요.');
    }

    if (!authState.isAdmin && password.length < 4) {
      return createActionFailure('비밀번호를 입력해주세요.');
    }

    if (parentId && !authState.isAdmin) {
      return createActionFailure('관리자만 답신을 작성할 수 있습니다.');
    }

    const entry = await createGuestbookEntry({
      authorBlogUrl: authorBlogUrl || null,
      authorName: authState.isAdmin ? 'admin' : authorName,
      content,
      isAdminAuthor: authState.isAdmin,
      isSecret,
      parentId,
      password: authState.isAdmin ? '' : password,
    });

    revalidateGuestbookCache({ parentId: entry.parent_id });

    return createActionSuccess({ entry });
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '방명록 등록에 실패했습니다.',
    );
  }
};

/**
 * 비밀글 비밀번호를 검증하고 숨겨진 본문을 반환합니다.
 */
export const verifyGuestbookSecretAction = async (
  _previousState: ActionResult<GuestbookVerifyActionData>,
  formData: FormData,
): Promise<ActionResult<GuestbookVerifyActionData>> => {
  const validation = validateActionInput(
    verifyGuestbookSecretSchema,
    Object.fromEntries(formData.entries()),
  );

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const entry = await verifyGuestbookSecret(validation.data);

    return createActionSuccess({ entry });
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '비밀글 확인에 실패했습니다.',
    );
  }
};

/**
 * 방명록 항목을 수정합니다.
 */
export const updateGuestbookEntryAction = async (input: {
  content: string;
  entryId: string;
  password: string;
}): Promise<ActionResult<GuestbookEntry>> => {
  const validation = validateActionInput(updateGuestbookEntrySchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const authState = await getServerAuthState();

    const entry = await updateGuestbookEntry({
      content: validation.data.content,
      entryId: validation.data.entryId,
      isAdminActor: authState.isAdmin,
      password: validation.data.password,
    });

    revalidateGuestbookCache({
      entryId: entry.parent_id ? null : validation.data.entryId,
      parentId: entry.parent_id,
    });

    return createActionSuccess(entry);
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '방명록 수정에 실패했습니다.',
    );
  }
};

/**
 * 방명록 항목을 삭제합니다.
 */
export const deleteGuestbookEntryAction = async (input: {
  entryId: string;
  password: string;
}): Promise<ActionResult<{ deletedId: string }>> => {
  const validation = validateActionInput(deleteGuestbookEntrySchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const authState = await getServerAuthState();

    const deleted = await deleteGuestbookEntry({
      entryId: validation.data.entryId,
      isAdminActor: authState.isAdmin,
      password: validation.data.password,
    });

    revalidateGuestbookCache({
      entryId: deleted.parentId ? null : deleted.id,
      parentId: deleted.parentId,
    });

    return createActionSuccess({ deletedId: deleted.id });
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '방명록 삭제에 실패했습니다.',
    );
  }
};

/**
 * 무한 스크롤용 방명록 스레드 페이지를 조회합니다.
 */
export const getGuestbookThreadsPage = async (input: {
  cursor?: string | null;
  limit: number;
}): Promise<ActionResult<GuestbookThreadPage>> => {
  const validation = validateActionInput(guestbookThreadsPageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const authState = await getServerAuthState();

    const page = await getGuestbookThreads({
      cursor: validation.data.cursor,
      includeSecret: authState.isAdmin,
      limit: validation.data.limit,
    });

    return createActionSuccess(page);
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '방명록을 불러오지 못했습니다.',
    );
  }
};
