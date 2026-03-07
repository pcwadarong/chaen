import { NextResponse } from 'next/server';

import { getGuestbookThreads } from '@/entities/guestbook';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

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
    const authState = await getServerAuthState();
    const page = await getGuestbookThreads({
      cursor,
      includeSecret: authState.isAdmin,
      limit,
    });

    return NextResponse.json({
      isAdmin: authState.isAdmin,
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
