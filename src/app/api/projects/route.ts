import { NextResponse } from 'next/server';

import { getProjects } from '@/entities/project/api/list/get-projects';
import { readProjectFeedPageQuery } from '@/features/browse-projects/model/project-feed-page-query';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';

const PROJECTS_ROUTE_ERROR_MESSAGE = 'Failed to load projects';
const FEED_ROUTE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

/**
 * 프로젝트 목록 무한 스크롤용 페이지를 GET query 기준으로 반환합니다.
 */
export const GET = async (request: Request) => {
  const validation = readProjectFeedPageQuery(new URL(request.url).searchParams);

  if (!validation.ok) {
    return createApiErrorResponse(validation.errorMessage, 400);
  }

  try {
    const page = await getProjects({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return NextResponse.json(page, {
      headers: {
        'Cache-Control': FEED_ROUTE_CACHE_CONTROL,
      },
    });
  } catch {
    return createApiErrorResponse(PROJECTS_ROUTE_ERROR_MESSAGE, 500);
  }
};
