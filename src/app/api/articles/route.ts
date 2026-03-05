import { NextResponse } from 'next/server';

import { getArticles } from '@/entities/article/api/get-articles';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

/**
 * 아티클 목록을 cursor(offset) 기반으로 페이지 조회합니다.
 */
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const locale = url.searchParams.get('locale') ?? 'ko';
  const rawLimit = url.searchParams.get('limit');
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;

  try {
    const page = await getArticles({
      cursor,
      limit,
      locale,
    });

    return NextResponse.json({
      ok: true,
      ...page,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 500,
      error,
    });
  }
};
