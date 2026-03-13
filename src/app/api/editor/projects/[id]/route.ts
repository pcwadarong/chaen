import { NextResponse } from 'next/server';

import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { EDITOR_API_ERROR_MESSAGE } from '@/entities/editor/model/editor-api-error';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 project 편집 초기 데이터를 반환합니다.
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const { id } = await params;
      const seed = await getEditorSeed({
        contentId: id,
        contentType: 'project',
      });

      if (!seed) {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.projectNotFound, 404);
      }

      return NextResponse.json(seed);
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.editorProjectFetchFailed,
  });
