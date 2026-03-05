import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';
import { updateSession } from '@/shared/lib/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

/**
 * locale 라우팅과 Supabase 세션 갱신을 순서대로 처리합니다.
 */
export const middleware = async (request: NextRequest) => {
  const response = handleI18nRouting(request);

  return updateSession(request, response);
};

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
