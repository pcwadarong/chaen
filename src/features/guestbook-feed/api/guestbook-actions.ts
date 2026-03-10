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
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { normalizeCommentComposePassword } from '@/shared/lib/comment-compose';
import {
  getActionTranslations,
  resolveActionLocale,
} from '@/shared/lib/i18n/get-action-translations';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

type GuestbookActionMessages = ReturnType<typeof createGuestbookActionMessages>;

/**
 * 선택 입력 URL을 절대 경로로 정규화합니다.
 */
const normalizeOptionalHttpUrl = (value?: string) => {
  const trimmedValue = value?.trim() ?? '';
  if (!trimmedValue) return '';

  return normalizeHttpUrl(trimmedValue);
};

/**
 * 방명록 action 에러를 사용자 메시지로 정규화합니다.
 */
const getGuestbookActionErrorMessage = (
  error: unknown,
  fallbackMessage: string,
  messages: GuestbookActionMessages,
) => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const guestbookBusinessErrorMessageMap = {
    'admin auth required': messages.adminRequired,
    'entry not found': messages.entryNotFound,
    'invalid password': messages.invalidPassword,
    'parent entry not found': messages.entryNotFound,
    'parent password is missing': messages.missingParentSecret,
  } as const satisfies Record<string, string>;

  return (
    guestbookBusinessErrorMessageMap[
      error.message as keyof typeof guestbookBusinessErrorMessageMap
    ] ?? fallbackMessage
  );
};

/**
 * 방명록 action에서 사용하는 locale별 메시지 묶음을 생성합니다.
 */
const createGuestbookActionMessages = (t: Awaited<ReturnType<typeof getActionTranslations>>) => ({
  adminReplyOnly: t('serverAction.adminReplyOnly'),
  adminRequired: t('serverAction.adminRequired'),
  contentRequired: t('serverAction.contentRequired'),
  contentTooLong: t('serverAction.contentTooLong'),
  deleteFailed: t('serverAction.deleteFailed'),
  entryNotFound: t('serverAction.entryNotFound'),
  fetchFailed: t('serverAction.fetchFailed'),
  invalidPassword: t('serverAction.invalidPassword'),
  invalidUrl: t('serverAction.invalidUrl'),
  missingName: t('serverAction.missingName'),
  missingParentSecret: t('serverAction.missingParentSecret'),
  missingPassword: t('serverAction.missingPassword'),
  submitFailed: t('serverAction.submitFailed'),
  updateFailed: t('serverAction.updateFailed'),
  verifyFailed: t('serverAction.verifyFailed'),
});

const createGuestbookEntrySchema = (messages: GuestbookActionMessages) =>
  z.object({
    authorBlogUrl: z
      .string()
      .optional()
      .transform(normalizeOptionalHttpUrl)
      .refine(value => value !== null, {
        message: messages.invalidUrl,
      })
      .transform(value => value ?? ''),
    authorName: z
      .string()
      .optional()
      .transform(value => value?.trim() ?? ''),
    content: z.string().trim().min(1, messages.contentRequired).max(3000, messages.contentTooLong),
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

const verifyGuestbookSecretSchema = (messages: GuestbookActionMessages) =>
  z.object({
    entryId: z.string().trim().min(1, messages.entryNotFound),
    password: z
      .string()
      .transform(value => normalizeCommentComposePassword(value))
      .pipe(z.string().min(4, messages.missingPassword)),
  });

const updateGuestbookEntrySchema = (messages: GuestbookActionMessages) =>
  z.object({
    content: z.string().trim().min(1, messages.contentRequired).max(3000, messages.contentTooLong),
    entryId: z.string().trim().min(1, messages.entryNotFound),
    password: z
      .string()
      .optional()
      .transform(value => normalizeCommentComposePassword(value ?? '')),
  });

const deleteGuestbookEntrySchema = (messages: GuestbookActionMessages) =>
  z.object({
    entryId: z.string().trim().min(1, messages.entryNotFound),
    password: z
      .string()
      .optional()
      .transform(value => normalizeCommentComposePassword(value ?? '')),
  });

const guestbookThreadsPageSchema = z.object({
  cursor: z
    .string()
    .optional()
    .nullable()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
});

/**
 * 방명록 글/답글 작성 폼을 처리합니다.
 */
export const submitGuestbookEntry = async (
  _previousState: ActionResult<{ entry: GuestbookEntry }>,
  formData: FormData,
): Promise<ActionResult<{ entry: GuestbookEntry }>> => {
  const rawInput = Object.fromEntries(formData.entries());
  const t = await getActionTranslations({
    locale: resolveActionLocale(typeof rawInput.locale === 'string' ? rawInput.locale : null),
    namespace: 'Guest',
  });
  const messages = createGuestbookActionMessages(t);
  const validation = validateActionInput(createGuestbookEntrySchema(messages), rawInput);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  const { authorBlogUrl, authorName, content, isSecret, parentId, password } = validation.data;

  try {
    const authState = await getServerAuthState();

    if (!authState.isAdmin && !authorName) {
      return createActionFailure(messages.missingName);
    }

    if (!authState.isAdmin && password.length < 4) {
      return createActionFailure(messages.missingPassword);
    }

    if (parentId && !authState.isAdmin) {
      return createActionFailure(messages.adminReplyOnly);
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
      getGuestbookActionErrorMessage(error, messages.submitFailed, messages),
    );
  }
};

/**
 * 비밀글 비밀번호를 검증하고 숨겨진 본문을 반환합니다.
 */
export const verifyGuestbookSecretAction = async (
  _previousState: ActionResult<{ entry: GuestbookEntry }>,
  formData: FormData,
): Promise<ActionResult<{ entry: GuestbookEntry }>> => {
  const rawInput = Object.fromEntries(formData.entries());
  const t = await getActionTranslations({
    locale: resolveActionLocale(typeof rawInput.locale === 'string' ? rawInput.locale : null),
    namespace: 'Guest',
  });
  const messages = createGuestbookActionMessages(t);
  const validation = validateActionInput(verifyGuestbookSecretSchema(messages), rawInput);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const entry = await verifyGuestbookSecret(validation.data);

    return createActionSuccess({ entry });
  } catch (error) {
    return createActionFailure(
      getGuestbookActionErrorMessage(error, messages.verifyFailed, messages),
    );
  }
};

/**
 * 방명록 항목을 수정합니다.
 */
export const updateGuestbookEntryAction = async (input: {
  content: string;
  entryId: string;
  locale?: string | null;
  password: string;
}): Promise<ActionResult<GuestbookEntry>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'Guest',
  });
  const messages = createGuestbookActionMessages(t);
  const validation = validateActionInput(updateGuestbookEntrySchema(messages), input);

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
      getGuestbookActionErrorMessage(error, messages.updateFailed, messages),
    );
  }
};

/**
 * 방명록 항목을 삭제합니다.
 */
export const deleteGuestbookEntryAction = async (input: {
  entryId: string;
  locale?: string | null;
  password: string;
}): Promise<ActionResult<{ deletedId: string }>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'Guest',
  });
  const messages = createGuestbookActionMessages(t);
  const validation = validateActionInput(deleteGuestbookEntrySchema(messages), input);

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
      getGuestbookActionErrorMessage(error, messages.deleteFailed, messages),
    );
  }
};

/**
 * 무한 스크롤용 방명록 스레드 페이지를 조회합니다.
 */
export const getGuestbookThreadsPage = async (input: {
  cursor?: string | null;
  limit: number;
  locale?: string | null;
}): Promise<ActionResult<GuestbookThreadPage>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'Guest',
  });
  const messages = createGuestbookActionMessages(t);
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
      getGuestbookActionErrorMessage(error, messages.fetchFailed, messages),
    );
  }
};
