import { NextResponse } from 'next/server';

import { incrementArticleViewCount } from '@/entities/article/api/increment-article-view-count';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type ArticleViewRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * 아티클 조회수를 1 증가시킨 최신 값을 반환합니다.
 */
export const POST = async (_request: Request, { params }: ArticleViewRouteContext) => {
  const { id } = await params;

  try {
    const viewCount = await incrementArticleViewCount(id);

    return NextResponse.json({
      ok: true,
      viewCount,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 500,
      error,
      statusByReason: {
        'articles item not found': 404,
        'service role env is not configured': 503,
      },
    });
  }
};
