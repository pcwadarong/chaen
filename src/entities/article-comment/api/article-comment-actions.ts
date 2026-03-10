'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import {
  ARTICLE_COMMENTS_CACHE_TAG,
  createArticleCommentCacheTag,
  createArticleCommentsCacheTag,
} from '@/entities/article-comment/model/cache-tags';
import type { ArticleComment, ArticleCommentPage } from '@/entities/article-comment/model/types';
import { locales } from '@/i18n/routing';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
  createInitialActionResult,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { normalizeCommentComposePassword } from '@/shared/lib/comment-compose';
import {
  getActionTranslations,
  resolveActionLocale,
} from '@/shared/lib/i18n/get-action-translations';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

import { getArticleComments } from './get-article-comments';
import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from './mutate-article-comment';

type ArticleCommentActionMessages = ReturnType<typeof createArticleCommentActionMessages>;

/**
 * 선택 입력 URL을 절대 경로로 정규화합니다.
 */
const normalizeOptionalHttpUrl = (value?: string) => {
  const trimmedValue = value?.trim() ?? '';
  if (!trimmedValue) return '';

  return normalizeHttpUrl(trimmedValue);
};

/**
 * 댓글 action에서 사용하는 locale별 메시지 묶음을 생성합니다.
 */
const createArticleCommentActionMessages = (
  t: Awaited<ReturnType<typeof getActionTranslations>>,
) => ({
  articleNotFound: t('serverAction.articleNotFound'),
  commentNotFound: t('serverAction.commentNotFound'),
  contentRequired: t('serverAction.contentRequired'),
  contentTooLong: t('serverAction.contentTooLong'),
  deleteFailed: t('serverAction.deleteFailed'),
  fetchFailed: t('serverAction.fetchFailed'),
  invalidPassword: t('serverAction.invalidPassword'),
  invalidUrl: t('serverAction.invalidUrl'),
  missingName: t('serverAction.missingName'),
  missingPassword: t('serverAction.missingPassword'),
  submitFailed: t('serverAction.submitFailed'),
  updateFailed: t('serverAction.updateFailed'),
});

/**
 * 댓글 action 에러를 사용자 메시지로 정규화합니다.
 */
const getArticleCommentActionErrorMessage = (
  error: unknown,
  fallbackMessage: string,
  messages: ArticleCommentActionMessages,
) => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const businessErrorMessageMap = {
    'comment not found': messages.commentNotFound,
    'comment does not belong to article': messages.commentNotFound,
    'invalid password': messages.invalidPassword,
    'parent comment does not belong to article': messages.commentNotFound,
    'reply target must belong to parent thread': messages.commentNotFound,
  } as const satisfies Record<string, string>;

  return (
    businessErrorMessageMap[error.message as keyof typeof businessErrorMessageMap] ??
    fallbackMessage
  );
};

const createArticleCommentSchema = (messages: ArticleCommentActionMessages) =>
  z.object({
    articleId: z.string().trim().min(1, messages.articleNotFound),
    authorBlogUrl: z
      .string()
      .optional()
      .transform(normalizeOptionalHttpUrl)
      .refine(value => value !== null, {
        message: messages.invalidUrl,
      }),
    authorName: z.string().trim().min(1, messages.missingName),
    content: z.string().trim().min(1, messages.contentRequired).max(3000, messages.contentTooLong),
    parentId: z
      .string()
      .optional()
      .transform(value => value?.trim() || null),
    password: z
      .string()
      .optional()
      .transform(value => normalizeCommentComposePassword(value ?? ''))
      .pipe(z.string().min(4, messages.missingPassword)),
    replyToCommentId: z
      .string()
      .optional()
      .transform(value => value?.trim() || null),
  });

const articleCommentsPageSchema = (messages: ArticleCommentActionMessages) =>
  z.object({
    articleId: z.string().trim().min(1, messages.articleNotFound),
    fresh: z.boolean().optional().default(false),
    page: z.number().int().min(1).default(1),
    sort: z.enum(['latest', 'oldest']).default('latest'),
  });

const updateArticleCommentSchema = (messages: ArticleCommentActionMessages) =>
  z.object({
    articleId: z.string().trim().min(1, messages.articleNotFound),
    commentId: z.string().trim().min(1, messages.commentNotFound),
    content: z.string().trim().min(1, messages.contentRequired).max(3000, messages.contentTooLong),
    password: z
      .string()
      .optional()
      .transform(value => normalizeCommentComposePassword(value ?? ''))
      .pipe(z.string().min(4, messages.missingPassword)),
  });

const deleteArticleCommentSchema = (messages: ArticleCommentActionMessages) =>
  z.object({
    articleId: z.string().trim().min(1, messages.articleNotFound),
    commentId: z.string().trim().min(1, messages.commentNotFound),
    password: z
      .string()
      .optional()
      .transform(value => normalizeCommentComposePassword(value ?? ''))
      .pipe(z.string().min(4, messages.missingPassword)),
  });

type SubmitArticleCommentActionData = {
  comment: ArticleComment;
};

type ArticleCommentDeleteActionData = {
  deletedId: string;
};

/**
 * 댓글 작성 action의 초기 상태입니다.
 */
export const initialSubmitArticleCommentState =
  createInitialActionResult<SubmitArticleCommentActionData>();

/**
 * 댓글 태그와 locale별 상세 페이지 HTML 캐시를 함께 갱신합니다.
 */
const revalidateArticleCommentCaches = (articleId: string, commentId?: string) => {
  revalidateTag(ARTICLE_COMMENTS_CACHE_TAG);
  revalidateTag(createArticleCommentsCacheTag(articleId));

  if (commentId) {
    revalidateTag(createArticleCommentCacheTag(commentId));
  }

  locales.forEach(locale => {
    revalidatePath(`/${locale}/articles/${articleId}`);
  });
};

/**
 * 댓글 작성 폼을 처리합니다.
 */
export const submitArticleComment = async (
  _previousState: ActionResult<SubmitArticleCommentActionData>,
  formData: FormData,
): Promise<ActionResult<SubmitArticleCommentActionData>> => {
  const rawInput = Object.fromEntries(formData.entries());
  const t = await getActionTranslations({
    locale: resolveActionLocale(typeof rawInput.locale === 'string' ? rawInput.locale : null),
    namespace: 'ArticleComments',
  });
  const messages = createArticleCommentActionMessages(t);
  const validation = validateActionInput(createArticleCommentSchema(messages), rawInput);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    await getServerAuthState();

    const comment = await createArticleComment({
      articleId: validation.data.articleId,
      authorBlogUrl: validation.data.authorBlogUrl || null,
      authorName: validation.data.authorName,
      content: validation.data.content,
      parentId: validation.data.parentId,
      password: validation.data.password,
      replyToCommentId: validation.data.replyToCommentId,
    });

    revalidateArticleCommentCaches(validation.data.articleId, comment.id);

    return createActionSuccess({ comment });
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.submitFailed, messages),
    );
  }
};

/**
 * 댓글 목록 페이지를 정렬/페이지 조건에 맞춰 조회합니다.
 */
export const getArticleCommentsPageAction = async (input: {
  articleId: string;
  fresh?: boolean;
  locale?: string | null;
  page?: number;
  sort?: 'latest' | 'oldest';
}): Promise<ActionResult<ArticleCommentPage>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'ArticleComments',
  });
  const messages = createArticleCommentActionMessages(t);
  const validation = validateActionInput(articleCommentsPageSchema(messages), input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getArticleComments({
      articleId: validation.data.articleId,
      bypassCache: validation.data.fresh,
      page: validation.data.page,
      sort: validation.data.sort,
    });

    return createActionSuccess(page);
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.fetchFailed, messages),
    );
  }
};

/**
 * 비밀번호를 확인한 뒤 댓글을 수정합니다.
 */
export const updateArticleCommentAction = async (input: {
  articleId: string;
  commentId: string;
  content: string;
  locale?: string | null;
  password: string;
}): Promise<ActionResult<ArticleComment>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'ArticleComments',
  });
  const messages = createArticleCommentActionMessages(t);
  const validation = validateActionInput(updateArticleCommentSchema(messages), input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    await getServerAuthState();

    const comment = await updateArticleComment(validation.data);

    revalidateArticleCommentCaches(validation.data.articleId, validation.data.commentId);

    return createActionSuccess(comment);
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.updateFailed, messages),
    );
  }
};

/**
 * 비밀번호를 확인한 뒤 댓글을 삭제합니다.
 */
export const deleteArticleCommentAction = async (input: {
  articleId: string;
  commentId: string;
  locale?: string | null;
  password: string;
}): Promise<ActionResult<ArticleCommentDeleteActionData>> => {
  const t = await getActionTranslations({
    locale: resolveActionLocale(input.locale),
    namespace: 'ArticleComments',
  });
  const messages = createArticleCommentActionMessages(t);
  const validation = validateActionInput(deleteArticleCommentSchema(messages), input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    await getServerAuthState();

    const deleted = await deleteArticleComment(validation.data);

    revalidateArticleCommentCaches(validation.data.articleId, validation.data.commentId);

    return createActionSuccess({ deletedId: deleted.id });
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.deleteFailed, messages),
    );
  }
};
