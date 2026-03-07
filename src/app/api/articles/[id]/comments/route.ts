import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createArticleComment, getArticleComments } from '@/entities/article-comment';
import {
  ARTICLE_COMMENTS_CACHE_TAG,
  createArticleCommentCacheTag,
  createArticleCommentsCacheTag,
} from '@/entities/article-comment/model/cache-tags';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type CreateArticleCommentPayload = {
  authorBlogUrl?: unknown;
  authorName?: unknown;
  content?: unknown;
  isSecret?: unknown;
  parentId?: unknown;
  password?: unknown;
  replyToCommentId?: unknown;
};

/**
 * 아티클 댓글 페이지 데이터를 반환합니다.
 */
export const GET = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const url = new URL(request.url);
  const rawPage = url.searchParams.get('page');
  const sort = url.searchParams.get('sort');
  const page = rawPage ? Number.parseInt(rawPage, 10) : undefined;

  try {
    const payload = await getArticleComments({
      articleId: id,
      page,
      sort: sort === 'oldest' ? 'oldest' : 'latest',
    });

    return NextResponse.json({
      ok: true,
      ...payload,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 500,
      error,
    });
  }
};

/**
 * 아티클 댓글(원댓글/대댓글)을 생성합니다.
 */
export const POST = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as CreateArticleCommentPayload;

    const comment = await createArticleComment({
      articleId: id,
      authorBlogUrl: typeof payload.authorBlogUrl === 'string' ? payload.authorBlogUrl : null,
      authorName: typeof payload.authorName === 'string' ? payload.authorName : '',
      content: typeof payload.content === 'string' ? payload.content : '',
      isSecret: Boolean(payload.isSecret),
      parentId: typeof payload.parentId === 'string' ? payload.parentId : null,
      password: typeof payload.password === 'string' ? payload.password : '',
      replyToCommentId:
        typeof payload.replyToCommentId === 'string' ? payload.replyToCommentId : null,
    });

    revalidateTag(ARTICLE_COMMENTS_CACHE_TAG);
    revalidateTag(createArticleCommentsCacheTag(id));
    revalidateTag(createArticleCommentCacheTag(comment.id));

    return NextResponse.json({
      ok: true,
      comment,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 400,
      error,
      statusByReason: {
        'service role env is not configured': 503,
      },
    });
  }
};
