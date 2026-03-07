import { NextResponse } from 'next/server';

import { verifyArticleCommentSecret } from '@/entities/article-comment';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type VerifyPayload = {
  password?: unknown;
};

/**
 * 비밀번호 검증 후 비밀 댓글 본문을 반환합니다.
 */
export const POST = async (
  request: Request,
  context: { params: Promise<{ commentId: string; id: string }> },
) => {
  try {
    const { commentId, id } = await context.params;
    const payload = (await request.json()) as VerifyPayload;

    const comment = await verifyArticleCommentSecret({
      articleId: id,
      commentId,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

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
