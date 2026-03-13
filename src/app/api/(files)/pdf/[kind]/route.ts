import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileKind } from '@/entities/pdf-file/model/types';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';

type PdfFileRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * 내부 PDF 다운로드 경로를 signed URL로 위임합니다.
 */
export const GET = async (_request: Request, { params }: PdfFileRouteContext) => {
  const { kind } = await params;
  if (!isPdfFileKind(kind)) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  const signedUrl = await getPdfFileUrl({
    accessType: 'signed',
    kind,
  });

  if (!signedUrl) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  return Response.redirect(signedUrl);
};
