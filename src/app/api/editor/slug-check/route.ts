import { NextResponse } from 'next/server';

import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/editor/slug';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 전용 slug 중복 확인 API입니다.
 */
export const GET = async (request: Request) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const searchParams = new URL(request.url).searchParams;
      const type = searchParams.get('type');
      const excludeId = searchParams.get('excludeId');
      const normalizedSlug = normalizeSlugInput(searchParams.get('slug') ?? '');

      if (!normalizedSlug || !isValidSlugFormat(normalizedSlug)) {
        return createApiErrorResponse('Invalid slug', 400);
      }

      if (type !== 'article' && type !== 'project') {
        return createApiErrorResponse('Invalid content type', 400);
      }

      const result = await checkSlugDuplicate(normalizedSlug, {
        excludeId,
        type,
      });

      if (result.schemaMissing) {
        return createApiErrorResponse('Slug duplicate check is temporarily unavailable', 503);
      }

      return NextResponse.json({
        duplicate: result.data.duplicate,
        source: result.data.source,
      });
    },
    errorMessage: 'Slug duplicate check failed',
  });
