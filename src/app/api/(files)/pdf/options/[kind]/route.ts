import { getPdfFileDownloadOptions } from '@/entities/pdf-file/api/get-pdf-file-download-options';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileDownloadSource, isPdfFileKind } from '@/entities/pdf-file/model/types';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type PdfFileOptionsRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * 공개 페이지에서 PDF 다운로드 옵션 목록만 JSON으로 반환합니다.
 * 초기 문서 렌더와 파일 존재 여부 확인을 분리할 때 사용합니다.
 */
export const GET = async (request: Request, { params }: PdfFileOptionsRouteContext) => {
  const { kind } = await params;

  if (!isPdfFileKind(kind)) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  return runJsonRoute({
    action: async () => {
      const source = readPdfDownloadSource(request);

      if (source === false) {
        return createApiErrorResponse('Invalid PDF download source', 400);
      }

      return getPdfFileDownloadOptions(kind, {
        source: source ?? undefined,
      });
    },
    errorMessage: 'Failed to load PDF download options',
  });
};

/**
 * query string의 source 값을 읽고 유효한 다운로드 source만 반환합니다.
 * 값이 없으면 null, 형식이 잘못되면 false를 반환합니다.
 */
const readPdfDownloadSource = (request: Request) => {
  const source = new URL(request.url).searchParams.get('source');

  if (!source) return null;
  if (!isPdfFileDownloadSource(source)) return false;

  return source;
};
