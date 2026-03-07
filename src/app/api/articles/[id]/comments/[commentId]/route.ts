import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { deleteArticleComment, updateArticleComment } from '@/entities/article-comment';
import {
  ARTICLE_COMMENTS_CACHE_TAG,
  createArticleCommentCacheTag,
  createArticleCommentsCacheTag,
} from '@/entities/article-comment/model/cache-tags';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type UpdatePayload = {
  content?: unknown;
  password?: unknown;
};

type DeletePayload = {
  password?: unknown;
};

/**
 * 비밀번호 검증 후 아티클 댓글 본문을 수정합니다.
 */
export const PATCH = async (
  request: Request,
  context: { params: Promise<{ commentId: string; id: string }> },
) => {
  try {
    const { commentId, id } = await context.params;
    const payload = (await request.json()) as UpdatePayload;

    const comment = await updateArticleComment({
      articleId: id,
      commentId,
      content: typeof payload.content === 'string' ? payload.content : '',
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(ARTICLE_COMMENTS_CACHE_TAG);
    revalidateTag(createArticleCommentsCacheTag(id));
    revalidateTag(createArticleCommentCacheTag(commentId));

    return NextResponse.json({
      ok: true,
      comment,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 400,
      error,
      statusByReason: {
        'invalid password': 403,
        'service role env is not configured': 503,
      },
    });
  }
};

/**
 * 비밀번호 검증 후 아티클 댓글을 소프트 삭제합니다.
 */
export const DELETE = async (
  request: Request,
  context: { params: Promise<{ commentId: string; id: string }> },
) => {
  try {
    const { commentId, id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as DeletePayload;

    await deleteArticleComment({
      articleId: id,
      commentId,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(ARTICLE_COMMENTS_CACHE_TAG);
    revalidateTag(createArticleCommentsCacheTag(id));
    revalidateTag(createArticleCommentCacheTag(commentId));

    return NextResponse.json({
      ok: true,
      deletedId: commentId,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 400,
      error,
      statusByReason: {
        'invalid password': 403,
        'service role env is not configured': 503,
      },
    });
  }
};
