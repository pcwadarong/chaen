import { NextResponse } from 'next/server';

import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 draft 목록을 반환합니다.
 */
export const GET = async () =>
  runJsonRoute({
    adminOnly: true,
    action: async () => NextResponse.json(await getEditorDraftSummaries()),
    errorMessage: '임시저장 목록을 불러오지 못했습니다.',
  });
