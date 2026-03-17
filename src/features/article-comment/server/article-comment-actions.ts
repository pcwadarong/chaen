'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { getArticleComments } from '@/entities/article/comment/api/get-article-comments';
import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from '@/entities/article/comment/api/mutate-article-comment';
import {
  ARTICLE_COMMENT_ERROR_CODE,
  type ArticleCommentErrorCode,
  resolveArticleCommentErrorCode,
} from '@/entities/article/comment/error';
import type { ArticleComment, ArticleCommentPage } from '@/entities/article/comment/model';
import {
  ARTICLE_COMMENTS_CACHE_TAG,
  createArticleCommentCacheTag,
  createArticleCommentsCacheTag,
} from '@/entities/article/comment/model';
import { locales } from '@/i18n/routing';
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
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

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
  const errorCode = resolveArticleCommentErrorCode(error);

  const businessErrorMessageMap = {
    [ARTICLE_COMMENT_ERROR_CODE.commentNotFound]: messages.commentNotFound,
    [ARTICLE_COMMENT_ERROR_CODE.commentArticleMismatch]: messages.commentNotFound,
    [ARTICLE_COMMENT_ERROR_CODE.invalidParentReference]: messages.commentNotFound,
    [ARTICLE_COMMENT_ERROR_CODE.invalidPassword]: messages.invalidPassword,
    [ARTICLE_COMMENT_ERROR_CODE.parentCommentArticleMismatch]: messages.commentNotFound,
    [ARTICLE_COMMENT_ERROR_CODE.replyTargetMismatch]: messages.commentNotFound,
  } as const satisfies Partial<Record<ArticleCommentErrorCode, string>>;

  if (errorCode && errorCode in businessErrorMessageMap) {
    return businessErrorMessageMap[errorCode as keyof typeof businessErrorMessageMap];
  }

  return fallbackMessage;
};

/**
 * 댓글 action 에러 코드를 추출합니다.
 */
const getArticleCommentActionErrorCode = (error: unknown): ArticleCommentErrorCode | null =>
  resolveArticleCommentErrorCode(error);

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

type ArticleCommentDeleteActionData = {
  deletedId: string;
};

/**
 * 댓글 캐시 무효화 중 발생한 오류를 서버 로그로 남깁니다.
 */
const logArticleCommentRevalidationError = (
  phase: 'path' | 'slug' | 'tag',
  metadata: {
    articleId: string;
    articleSlug?: string | null;
    commentId?: string;
    locale?: string;
  },
  error: unknown,
) => {
  console.error('[article-comments] revalidate 실패', {
    articleId: metadata.articleId,
    articleSlug: metadata.articleSlug ?? null,
    commentId: metadata.commentId ?? null,
    error,
    locale: metadata.locale ?? null,
    phase,
  });
};

/**
 * 댓글 캐시 무효화에 필요한 공개 article slug를 조회합니다.
 */
const getArticleSlugById = async (articleId: string): Promise<string | null> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('id', articleId)
    .not('slug', 'is', null)
    .maybeSingle<{ slug: string | null }>();

  if (error) {
    throw new Error(`[article-comments] article slug 조회 실패: ${error.message}`);
  }

  return data?.slug?.trim() || null;
};

/**
 * 댓글 태그와 locale별 상세 페이지 HTML 캐시를 함께 갱신합니다.
 */
const revalidateArticleCommentCaches = async (articleId: string, commentId?: string) => {
  try {
    revalidateTag(ARTICLE_COMMENTS_CACHE_TAG);
  } catch (error) {
    logArticleCommentRevalidationError('tag', { articleId, commentId }, error);
  }

  try {
    revalidateTag(createArticleCommentsCacheTag(articleId));
  } catch (error) {
    logArticleCommentRevalidationError('tag', { articleId, commentId }, error);
  }

  if (commentId) {
    try {
      revalidateTag(createArticleCommentCacheTag(commentId));
    } catch (error) {
      logArticleCommentRevalidationError('tag', { articleId, commentId }, error);
    }
  }

  let articleSlug: string | null = null;

  try {
    articleSlug = await getArticleSlugById(articleId);
  } catch (error) {
    logArticleCommentRevalidationError('slug', { articleId, commentId }, error);
    return;
  }

  if (!articleSlug) return;

  locales.forEach(locale => {
    try {
      revalidatePath(`/${locale}/articles/${articleSlug}`);
    } catch (error) {
      logArticleCommentRevalidationError(
        'path',
        { articleId, articleSlug, commentId, locale },
        error,
      );
    }
  });
};

/**
 * 댓글 작성 폼을 처리합니다.
 */
export const submitArticleComment = async (
  _previousState: ActionResult<{ comment: ArticleComment }>,
  formData: FormData,
): Promise<ActionResult<{ comment: ArticleComment }>> => {
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

    await revalidateArticleCommentCaches(validation.data.articleId, comment.id);

    return createActionSuccess({ comment });
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.submitFailed, messages),
      getArticleCommentActionErrorCode(error),
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
      getArticleCommentActionErrorCode(error),
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

    await revalidateArticleCommentCaches(validation.data.articleId, validation.data.commentId);

    return createActionSuccess(comment);
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.updateFailed, messages),
      getArticleCommentActionErrorCode(error),
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

    await revalidateArticleCommentCaches(validation.data.articleId, validation.data.commentId);

    return createActionSuccess({ deletedId: deleted.id });
  } catch (error) {
    return createActionFailure(
      getArticleCommentActionErrorMessage(error, messages.deleteFailed, messages),
      getArticleCommentActionErrorCode(error),
    );
  }
};
