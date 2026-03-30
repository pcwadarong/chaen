import { NextResponse } from 'next/server';

import { getArticles } from '@/entities/article/api/list/get-articles';
import { readArticleFeedPageQuery } from '@/features/browse-articles/model/article-feed-page-query';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';

const ARTICLES_ROUTE_ERROR_MESSAGE = 'Failed to load articles';
const FEED_ROUTE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

/**
 * 아티클 목록 무한 스크롤용 페이지를 GET query 기준으로 반환합니다.
 */
export const GET = async (request: Request) => {
  const validation = readArticleFeedPageQuery(new URL(request.url).searchParams);

  if (!validation.ok) {
    return createApiErrorResponse(validation.errorMessage, 400);
  }

  try {
    const page = await getArticles({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
      query: validation.data.query,
      tag: validation.data.tag,
    });

    return NextResponse.json(page, {
      headers: {
        'Cache-Control': FEED_ROUTE_CACHE_CONTROL,
      },
    });
  } catch {
    return createApiErrorResponse(ARTICLES_ROUTE_ERROR_MESSAGE, 500);
  }
};
