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
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

import { getArticleComments } from './get-article-comments';
import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from './mutate-article-comment';

const createArticleCommentSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  authorBlogUrl: z
    .string()
    .optional()
    .transform(value => value?.trim() ?? '')
    .refine(value => !value || Boolean(normalizeHttpUrl(value)), {
      message: '홈페이지 주소를 다시 확인해주세요.',
    }),
  authorName: z.string().trim().min(1, '이름을 입력해주세요.'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(3000, '내용은 3000자 이하로 입력해주세요.'),
  parentId: z
    .string()
    .optional()
    .transform(value => value?.trim() || null),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? ''))
    .pipe(z.string().min(4, '비밀번호를 입력해주세요.')),
  replyToCommentId: z
    .string()
    .optional()
    .transform(value => value?.trim() || null),
});

const articleCommentsPageSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  fresh: z.boolean().optional().default(false),
  page: z.number().int().min(1).default(1),
  sort: z.enum(['latest', 'oldest']).default('latest'),
});

const updateArticleCommentSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  commentId: z.string().trim().min(1, '대상 댓글을 확인할 수 없습니다.'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(3000, '내용은 3000자 이하로 입력해주세요.'),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? ''))
    .pipe(z.string().min(4, '비밀번호를 입력해주세요.')),
});

const deleteArticleCommentSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  commentId: z.string().trim().min(1, '대상 댓글을 확인할 수 없습니다.'),
  password: z
    .string()
    .optional()
    .transform(value => normalizeCommentComposePassword(value ?? ''))
    .pipe(z.string().min(4, '비밀번호를 입력해주세요.')),
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
  const validation = validateActionInput(
    createArticleCommentSchema,
    Object.fromEntries(formData.entries()),
  );

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
      error instanceof Error ? error.message : '댓글 등록에 실패했습니다.',
    );
  }
};

/**
 * 댓글 목록 페이지를 정렬/페이지 조건에 맞춰 조회합니다.
 */
export const getArticleCommentsPageAction = async (input: {
  articleId: string;
  fresh?: boolean;
  page?: number;
  sort?: 'latest' | 'oldest';
}): Promise<ActionResult<ArticleCommentPage>> => {
  const validation = validateActionInput(articleCommentsPageSchema, input);

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
      error instanceof Error ? error.message : '댓글을 불러오지 못했습니다.',
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
  password: string;
}): Promise<ActionResult<ArticleComment>> => {
  const validation = validateActionInput(updateArticleCommentSchema, input);

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
      error instanceof Error ? error.message : '댓글 수정에 실패했습니다.',
    );
  }
};

/**
 * 비밀번호를 확인한 뒤 댓글을 삭제합니다.
 */
export const deleteArticleCommentAction = async (input: {
  articleId: string;
  commentId: string;
  password: string;
}): Promise<ActionResult<ArticleCommentDeleteActionData>> => {
  const validation = validateActionInput(deleteArticleCommentSchema, input);

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
      error instanceof Error ? error.message : '댓글 삭제에 실패했습니다.',
    );
  }
};
