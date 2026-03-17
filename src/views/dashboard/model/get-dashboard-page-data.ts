import { buildPdfFileAssetDownloadPath, getPdfFileAvailability } from '@/entities/pdf-file';
import { listPdfFileAssetStorageConfigs } from '@/entities/pdf-file/model/config';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload/model/admin-pdf-upload.types';

import 'server-only';

type DashboardPageData = {
  pdfUploadItems: AdminPdfUploadItem[];
};

/**
 * 관리자 대시보드용 PDF 준비 상태를 읽고, 실패 시 자산 키와 함께 서버 로그를 남깁니다.
 */
const getDashboardPdfAvailability = async (assetKey: AdminPdfUploadItem['assetKey']) => {
  try {
    return await getPdfFileAvailability({ assetKey });
  } catch (error) {
    console.error('[dashboard] pdf availability read failed', {
      assetKey,
      error,
    });

    return false;
  }
};

/**
 * 관리자 대시보드에서 사용할 PDF 업로드 카드 데이터를 조합합니다.
 * 자산 키별 고정 파일명은 env 설정을 우선 사용하고, 파일 존재 여부는 storage cached read 결과를 반영합니다.
 */
export const getDashboardPageData = async (): Promise<DashboardPageData> => {
  const pdfUploadItems = await Promise.all(
    listPdfFileAssetStorageConfigs().map(async storageConfig => {
      const isPdfReady = await getDashboardPdfAvailability(storageConfig.assetKey);

      return {
        assetKey: storageConfig.assetKey,
        downloadFileName: storageConfig.downloadFileName,
        downloadPath: buildPdfFileAssetDownloadPath(storageConfig.assetKey),
        filePath: storageConfig.filePath,
        isPdfReady,
        title: storageConfig.title,
      } satisfies AdminPdfUploadItem;
    }),
  );

  return {
    pdfUploadItems,
  };
};
