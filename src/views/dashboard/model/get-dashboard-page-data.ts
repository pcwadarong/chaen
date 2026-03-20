import { buildPdfFileAssetDownloadPath } from '@/entities/pdf-file';
import { listPdfFileAssetStorageConfigs } from '@/entities/pdf-file/model/config';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload/model/admin-pdf-upload.types';

import 'server-only';

type DashboardPageData = {
  pdfUploadItems: AdminPdfUploadItem[];
};

/**
 * 관리자 대시보드에서 사용할 PDF 업로드 카드 데이터를 조합합니다.
 * 자산 키별 고정 파일명과 다운로드 확인 경로만 먼저 렌더하고,
 * 파일 준비 상태는 hydration 이후 클라이언트에서 분리해 확인합니다.
 */
export const getDashboardPageData = async (): Promise<DashboardPageData> => {
  const pdfUploadItems = listPdfFileAssetStorageConfigs().map(storageConfig => ({
    assetKey: storageConfig.assetKey,
    downloadFileName: storageConfig.downloadFileName,
    downloadPath: buildPdfFileAssetDownloadPath(storageConfig.assetKey),
    filePath: storageConfig.filePath,
    isPdfReady: false,
    title: storageConfig.title,
  })) satisfies AdminPdfUploadItem[];

  return {
    pdfUploadItems,
  };
};
