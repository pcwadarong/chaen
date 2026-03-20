import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileKind } from '@/entities/pdf-file/model/types';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type PdfFileAvailabilityRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * PDF kind 단위 준비 상태를 JSON으로 반환합니다.
 * 관리자 편집 화면에서 SSR과 분리된 상태 확인에 사용합니다.
 */
export const GET = async (_request: Request, { params }: PdfFileAvailabilityRouteContext) => {
  const { kind } = await params;

  if (!isPdfFileKind(kind)) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  return runJsonRoute({
    action: async () => ({
      isPdfReady: await getPdfFileAvailability({ kind }),
      kind,
    }),
    errorMessage: 'Failed to load PDF availability',
  });
};
