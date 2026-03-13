import { buildPdfFileDownloadPath } from '@/entities/pdf-file';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import { isPdfFileKind } from '@/entities/pdf-file/model/types';
import { uploadPdfFile } from '@/features/upload-pdf-file';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type PdfUploadRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * 관리자 편집 화면에서 고정 PDF 경로를 교체 업로드합니다.
 */
export const POST = async (request: Request, { params }: PdfUploadRouteContext) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const { kind } = await params;

      if (!isPdfFileKind(kind)) {
        return createApiErrorResponse('Not Found', 404);
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File) || file.type !== 'application/pdf') {
        return createApiErrorResponse('Invalid PDF upload payload', 400);
      }

      const storageConfig = getPdfFileStorageConfig(kind);
      const filePath = await uploadPdfFile({
        bucket: storageConfig.bucket,
        file,
        filePath: storageConfig.filePath,
        upsert: true,
      });

      return {
        downloadFileName: storageConfig.downloadFileName,
        downloadPath: buildPdfFileDownloadPath(kind),
        filePath,
        isPdfReady: true,
      };
    },
    errorMessage: 'PDF upload failed',
  });
