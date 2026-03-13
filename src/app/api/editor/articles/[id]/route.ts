import { NextResponse } from 'next/server';

import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 article 편집 초기 데이터를 반환합니다.
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const { id } = await params;
      const seed = await getEditorSeed({
        contentId: id,
        contentType: 'article',
      });

      if (!seed) {
        return createApiErrorResponse('Article not found', 404);
      }

      return NextResponse.json(seed);
    },
    errorMessage: '아티클 데이터를 불러오지 못했습니다.',
  });
