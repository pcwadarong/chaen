import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { buildAdminPath } from '@/features/admin-session/model/admin-path';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/shared/lib/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

/**
 * locale 라우팅과 Supabase 세션 갱신을 순서대로 처리합니다.
 */
export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const [, localeSegment = ''] = pathname.split('/');
  const isLocalizedAdminRoute =
    pathname === `/${localeSegment}/admin` || pathname.startsWith(`/${localeSegment}/admin/`);
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute) {
    return updateSession(request, NextResponse.next());
  }

  if (
    localeSegment &&
    routing.locales.includes(localeSegment as (typeof routing.locales)[number]) &&
    isLocalizedAdminRoute
  ) {
    const redirectedUrl = request.nextUrl.clone();
    redirectedUrl.pathname = buildAdminPath({}) + pathname.slice(`/${localeSegment}/admin`.length);

    const redirectResponse = NextResponse.redirect(redirectedUrl);

    return redirectResponse;
  }

  const response = handleI18nRouting(request);

  return updateSession(request, response);
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
