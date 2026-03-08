import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';

/**
 * 아티클 캐시를 온디맨드로 무효화합니다.
 * `articleId`를 전달하면 단일 아티클 태그까지 함께 갱신합니다.
 */
export const POST = async (request: Request) => {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const secretFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const secretFromQuery = url.searchParams.get('secret');
  const receivedSecret = secretFromHeader ?? secretFromQuery;

  if (!process.env.REVALIDATE_SECRET || receivedSecret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let articleId: string | null = null;
  try {
    const body = (await request.json()) as { articleId?: unknown };
    if (typeof body.articleId === 'string' && body.articleId.trim()) {
      articleId = body.articleId.trim();
    }
  } catch {
    // body가 없거나 JSON이 아니면 전체 아티클 태그만 갱신합니다.
  }

  revalidateTag(ARTICLES_CACHE_TAG);
  if (articleId) revalidateTag(createArticleCacheTag(articleId));

  return NextResponse.json({
    ok: true,
    revalidated: articleId
      ? [ARTICLES_CACHE_TAG, createArticleCacheTag(articleId)]
      : [ARTICLES_CACHE_TAG],
  });
};
