import { revalidateTag } from 'next/cache';

import { buildPdfFileAssetDownloadPath, revalidatePdfDependentPaths } from '@/entities/pdf-file';
import {
  createPdfFileAvailabilityCacheTag,
  PDF_FILES_CACHE_TAG,
} from '@/entities/pdf-file/model/cache-tags';
import { getPdfFileAssetStorageConfig } from '@/entities/pdf-file/model/config';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileAssetKey } from '@/entities/pdf-file/model/types';
import { uploadPdfFile } from '@/features/upload-pdf-file';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type PdfAssetUploadRouteContext = {
  params: Promise<{
    assetKey: string;
  }>;
};

/**
 * 관리자 대시보드에서 개별 PDF 자산 고정 경로를 교체 업로드합니다.
 */
export const POST = async (request: Request, { params }: PdfAssetUploadRouteContext) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const { assetKey } = await params;

      if (!isPdfFileAssetKey(assetKey)) {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File) || file.type !== 'application/pdf') {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.invalidUploadPayload, 400);
      }

      const storageConfig = getPdfFileAssetStorageConfig(assetKey);
      const filePath = await uploadPdfFile({
        bucket: storageConfig.bucket,
        file,
        filePath: storageConfig.filePath,
        upsert: true,
      });

      revalidateTag(PDF_FILES_CACHE_TAG);
      revalidateTag(createPdfFileAvailabilityCacheTag(assetKey));
      revalidateTag(createPdfFileAvailabilityCacheTag(storageConfig.kind));
      revalidatePdfDependentPaths(storageConfig.kind);

      return {
        assetKey,
        downloadFileName: storageConfig.downloadFileName,
        downloadPath: buildPdfFileAssetDownloadPath(assetKey),
        filePath,
        isPdfReady: true,
      };
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.pdfUploadFailed,
  });
