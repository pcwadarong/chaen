import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileAssetKey } from '@/entities/pdf-file/model/types';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';

type PdfFileAssetRouteContext = {
  params: Promise<{
    assetKey: string;
  }>;
};

/**
 * 특정 PDF 자산의 내부 다운로드 경로를 signed URL 생성 플로우로 위임합니다.
 */
export const GET = async (_request: Request, { params }: PdfFileAssetRouteContext) => {
  const { assetKey } = await params;

  if (!isPdfFileAssetKey(assetKey)) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  const signedUrl = await getPdfFileUrl({
    accessType: 'signed',
    assetKey,
  });

  if (!signedUrl) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  return Response.redirect(signedUrl);
};
