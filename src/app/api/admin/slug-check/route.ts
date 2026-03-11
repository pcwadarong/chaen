import { NextResponse } from 'next/server';

import { checkContentSlugDuplicate } from '@/entities/content/api/check-content-slug-duplicate';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/editor/slug';

/**
 * 관리자 전용 slug 중복 확인 API입니다.
 */
export const GET = async (request: Request) => {
  const authState = await getServerAuthState();
  if (!authState.isAdmin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const normalizedSlug = normalizeSlugInput(new URL(request.url).searchParams.get('slug') ?? '');

  if (!normalizedSlug || !isValidSlugFormat(normalizedSlug)) {
    return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });
  }

  const result = await checkContentSlugDuplicate(normalizedSlug);

  return NextResponse.json({
    duplicate: result.data.duplicate,
    source: result.data.source,
  });
};
