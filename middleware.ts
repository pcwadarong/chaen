import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

/**
 * 모든 앱 라우트 요청 전에 Supabase 세션을 동기화합니다.
 */
export const middleware = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
