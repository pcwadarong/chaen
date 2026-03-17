import { buildPdfFileAssetDownloadPath } from '@/entities/pdf-file/model/download-path';
import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';

type UploadPdfFileByAssetKeyResult = {
  assetKey: PdfFileAssetKey;
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
};

const DEFAULT_UPLOAD_ERROR_MESSAGE = 'PDF 업로드에 실패했습니다.';

const isUploadPdfFileByAssetKeyResult = (
  value: unknown,
): value is UploadPdfFileByAssetKeyResult & { assetKey: PdfFileAssetKey } =>
  typeof value === 'object' &&
  value !== null &&
  'assetKey' in value &&
  'downloadFileName' in value &&
  'downloadPath' in value &&
  'filePath' in value &&
  'isPdfReady' in value;

/**
 * 관리자 대시보드에서 자산 키별 PDF 업로드 API를 호출합니다.
 */
export const uploadPdfFileByAssetKey = async ({
  assetKey,
  file,
}: {
  assetKey: PdfFileAssetKey;
  file: File;
}): Promise<UploadPdfFileByAssetKeyResult> => {
  const formData = new FormData();

  formData.set('file', file);

  const response = await fetch(`/api/pdf/file/${assetKey}/upload`, {
    body: formData,
    method: 'POST',
  });
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    try {
      const fallbackText = await response.text();
      body = fallbackText ? { error: fallbackText } : null;
    } catch {
      body = null;
    }
  }

  const errorMessage =
    typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      ? body.error
      : DEFAULT_UPLOAD_ERROR_MESSAGE;

  if (!response.ok || !isUploadPdfFileByAssetKeyResult(body)) {
    throw new Error(errorMessage);
  }

  return {
    assetKey: body.assetKey,
    downloadFileName: body.downloadFileName,
    downloadPath: body.downloadPath || buildPdfFileAssetDownloadPath(body.assetKey),
    filePath: body.filePath,
    isPdfReady: body.isPdfReady,
  };
};
