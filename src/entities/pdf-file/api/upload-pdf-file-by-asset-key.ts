import { buildPdfFileAssetDownloadPath } from '@/entities/pdf-file/model/download-path';
import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';

type UploadPdfFileByAssetKeyResult = {
  assetKey: PdfFileAssetKey;
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
};

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
  const body = (await response.json()) as
    | UploadPdfFileByAssetKeyResult
    | {
        error?: string;
      };

  if (!response.ok || !('filePath' in body) || !('assetKey' in body)) {
    throw new Error(
      'error' in body ? (body.error ?? 'PDF 업로드에 실패했습니다.') : 'PDF 업로드에 실패했습니다.',
    );
  }

  return {
    assetKey: body.assetKey,
    downloadFileName: body.downloadFileName,
    downloadPath: body.downloadPath || buildPdfFileAssetDownloadPath(assetKey),
    filePath: body.filePath,
    isPdfReady: body.isPdfReady,
  };
};
