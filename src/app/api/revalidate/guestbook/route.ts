import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import {
  createGuestbookEntryCacheTag,
  GUESTBOOK_CACHE_TAG,
} from '@/entities/guestbook/model/cache-tags';

/**
 * 방명록 캐시를 온디맨드로 무효화합니다.
 * `entryId`를 전달하면 단일 항목 태그까지 함께 갱신합니다.
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

  let entryId: string | null = null;
  try {
    const body = (await request.json()) as { entryId?: unknown };
    if (typeof body.entryId === 'string' && body.entryId.trim()) {
      entryId = body.entryId.trim();
    }
  } catch {
    // body가 없거나 JSON이 아니면 전체 방명록 태그만 갱신합니다.
  }

  revalidateTag(GUESTBOOK_CACHE_TAG);
  if (entryId) revalidateTag(createGuestbookEntryCacheTag(entryId));

  return NextResponse.json({
    ok: true,
    revalidated: entryId
      ? [GUESTBOOK_CACHE_TAG, createGuestbookEntryCacheTag(entryId)]
      : [GUESTBOOK_CACHE_TAG],
  });
};
