import { NextResponse } from 'next/server';

import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import { EDITOR_API_ERROR_MESSAGE } from '@/entities/editor/model/editor-api-error';
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
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.slugCheckInvalidSlug, 400);
      }

      if (type !== 'article' && type !== 'project') {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.slugCheckInvalidContentType, 400);
      }

      const result = await checkSlugDuplicate(normalizedSlug, {
        excludeId,
        type,
      });

      if (result.schemaMissing) {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.slugCheckUnavailable, 503);
      }

      return NextResponse.json({
        duplicate: result.data.duplicate,
        source: result.data.source,
      });
    },
    errorMessage: EDITOR_API_ERROR_MESSAGE.slugCheckFailed,
  });
