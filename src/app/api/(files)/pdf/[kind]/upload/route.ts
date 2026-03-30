import { revalidateTag } from 'next/cache';

import { buildPdfFileDownloadPath, revalidatePdfDependentPaths } from '@/entities/pdf-file';
import {
  createPdfFileAvailabilityCacheTag,
  PDF_FILES_CACHE_TAG,
} from '@/entities/pdf-file/model/cache-tags';
import {
  getDefaultPdfFileAssetKey,
  getPdfFileStorageConfig,
} from '@/entities/pdf-file/model/config';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { isPdfFileKind } from '@/entities/pdf-file/model/types';
import { uploadPdfFile } from '@/features/upload-pdf-file';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type PdfUploadRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

const PDF_FILE_SIGNATURE = '%PDF-';

/**
 * multipart form-data에서 전달된 파일 객체가 PDF 업로드 처리에 필요한 형태인지 확인합니다.
 */
const isPdfUploadFile = (value: FormDataEntryValue | null): value is File =>
  typeof value === 'object' &&
  value !== null &&
  'arrayBuffer' in value &&
  typeof value.arrayBuffer === 'function' &&
  'name' in value &&
  typeof value.name === 'string' &&
  'type' in value &&
  typeof value.type === 'string';

/**
 * 관리자 편집 화면에서 kind 기본 PDF 경로를 교체 업로드합니다.
 */
export const POST = async (request: Request, { params }: PdfUploadRouteContext) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const { kind } = await params;

      if (!isPdfFileKind(kind)) {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.notFound, 404);
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!isPdfUploadFile(file)) {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.invalidUploadPayload, 400);
      }

      let fileHeader = '';

      try {
        fileHeader = new TextDecoder('utf-8').decode(
          new Uint8Array(await file.arrayBuffer()).subarray(0, PDF_FILE_SIGNATURE.length),
        );
      } catch {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.invalidUploadPayload, 400);
      }

      if (fileHeader !== PDF_FILE_SIGNATURE) {
        return createApiErrorResponse(PDF_FILE_API_ERROR_MESSAGE.invalidUploadPayload, 400);
      }

      const storageConfig = getPdfFileStorageConfig(kind);
      const filePath = await uploadPdfFile({
        bucket: storageConfig.bucket,
        file,
        filePath: storageConfig.filePath,
        upsert: true,
      });

      revalidateTag(PDF_FILES_CACHE_TAG);
      revalidateTag(createPdfFileAvailabilityCacheTag(kind));
      revalidateTag(createPdfFileAvailabilityCacheTag(getDefaultPdfFileAssetKey(kind)));
      revalidatePdfDependentPaths(kind);

      return {
        downloadFileName: storageConfig.downloadFileName,
        downloadPath: buildPdfFileDownloadPath(kind),
        filePath,
        isPdfReady: true,
      };
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.pdfUploadFailed,
  });
