import { NextResponse } from 'next/server';

import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 draft 목록을 반환합니다.
 */
export const GET = async () =>
  runJsonRoute({
    adminOnly: true,
    action: async () => NextResponse.json(await getEditorDraftSummaries()),
    errorMessage: API_INTERNAL_ERROR_MESSAGE.editorDraftsFetchFailed,
  });
