import { buildPdfFileAssetDownloadPath } from '@/entities/pdf-file';
import { listPdfFileAssetStorageConfigs } from '@/entities/pdf-file/model/config';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload/model/admin-pdf-upload.types';

import 'server-only';

/**
 * 관리자 PDF 업로드 패널에서 사용할 고정 자산 목록을 조합합니다.
 * 파일 준비 상태는 클라이언트 hydration 이후 별도로 확인하므로 초기값은 false로 둡니다.
 *
 * @returns 관리자 PDF 업로드 행 렌더링에 필요한 고정 자산 정보 배열
 */
export const getAdminPdfUploadItems = (): AdminPdfUploadItem[] =>
  listPdfFileAssetStorageConfigs().map(storageConfig => ({
    assetKey: storageConfig.assetKey,
    downloadFileName: storageConfig.downloadFileName,
    downloadPath: buildPdfFileAssetDownloadPath(storageConfig.assetKey),
    filePath: storageConfig.filePath,
    isPdfReady: false,
    title: storageConfig.title,
  })) satisfies AdminPdfUploadItem[];
