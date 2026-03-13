import { buildPdfFileDownloadPath } from '@/entities/pdf-file/model/download-path';
import type { PdfFileKind } from '@/entities/pdf-file/model/types';

type UploadPdfFileByKindResult = {
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
};

/**
 * 관리자 resume/portfolio 편집 화면에서 kind별 PDF 업로드 API를 호출합니다.
 */
export const uploadPdfFileByKind = async ({
  file,
  kind,
}: {
  file: File;
  kind: PdfFileKind;
}): Promise<UploadPdfFileByKindResult> => {
  const formData = new FormData();

  formData.set('file', file);

  const response = await fetch(`/api/pdf/${kind}/upload`, {
    body: formData,
    method: 'POST',
  });
  const body = (await response.json()) as
    | UploadPdfFileByKindResult
    | {
        error?: string;
      };

  if (!response.ok || !('filePath' in body)) {
    throw new Error(
      'error' in body ? (body.error ?? 'PDF 업로드에 실패했습니다.') : 'PDF 업로드에 실패했습니다.',
    );
  }

  return {
    downloadFileName: body.downloadFileName,
    downloadPath: body.downloadPath || buildPdfFileDownloadPath(kind),
    filePath: body.filePath,
    isPdfReady: body.isPdfReady,
  };
};
