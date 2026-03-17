import { createPdfDownloadLog } from '@/entities/pdf-file/api/create-pdf-download-log';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getPdfFileAssetStorageConfig } from '@/entities/pdf-file/model/config';
import {
  doesPdfDownloadSourceMatchKind,
  extractPdfDownloadRequestMetadata,
} from '@/entities/pdf-file/model/download-log';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileAssetKey, isPdfFileDownloadSource } from '@/entities/pdf-file/model/types';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';

type PdfFileAssetRouteContext = {
  params: Promise<{
    assetKey: string;
  }>;
};

/**
 * 특정 PDF 자산의 내부 다운로드 경로를 signed URL 생성 플로우로 위임합니다.
 */
export const GET = async (request: Request, { params }: PdfFileAssetRouteContext) => {
  const { assetKey } = await params;

  if (!isPdfFileAssetKey(assetKey)) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  const storageConfig = getPdfFileAssetStorageConfig(assetKey);

  const signedUrl = await getPdfFileUrl({
    accessType: 'signed',
    assetKey,
  });

  if (!signedUrl) {
    return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
  }

  const source = readPdfDownloadSource(request);

  if (source && doesPdfDownloadSourceMatchKind(source, storageConfig.kind)) {
    const metadata = extractPdfDownloadRequestMetadata({ request });

    void createPdfDownloadLog({
      assetKey,
      countryCode: metadata.countryCode,
      deviceType: metadata.deviceType,
      fileLocale: storageConfig.locale,
      ip: metadata.ip,
      kind: storageConfig.kind,
      referer: metadata.referer,
      refererPath: metadata.refererPath,
      source,
      utmSource: metadata.utmSource,
    })
      .then(didPersist => {
        if (!didPersist) {
          console.error('[api/pdf/file] createPdfDownloadLog skipped or failed', {
            assetKey,
            source,
          });
        }
      })
      .catch(error => {
        console.error('[api/pdf/file] createPdfDownloadLog crashed', {
          assetKey,
          error,
          source,
        });
      });
  }

  return Response.redirect(signedUrl);
};

/**
 * 다운로드 요청의 source query를 읽고 지원하는 값만 반환합니다.
 */
const readPdfDownloadSource = (request: Request) => {
  const source = new URL(request.url).searchParams.get('source');
  if (!source || !isPdfFileDownloadSource(source)) return null;

  return source;
};
