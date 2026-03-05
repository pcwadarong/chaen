import { NextResponse } from 'next/server';

import { getGuestbookThreads } from '@/entities/guestbook';

/**
 * 방명록 스레드 목록을 cursor(offset) 기반으로 조회합니다.
 * 클라이언트 무한스크롤에서 사용합니다.
 */
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const rawLimit = url.searchParams.get('limit');
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;

  try {
    const page = await getGuestbookThreads({
      cursor,
      includeSecret: true,
      limit,
    });

    return NextResponse.json({
      isAdmin: true,
      ok: true,
      ...page,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';

    return NextResponse.json(
      {
        ok: false,
        reason: message,
      },
      { status: 500 },
    );
  }
};
