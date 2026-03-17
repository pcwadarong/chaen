import { listPdfFileAssetStorageConfigsByKind } from '@/entities/pdf-file/model/config';
import { buildPdfFileAssetDownloadPath } from '@/entities/pdf-file/model/download-path';
import type { PdfFileDownloadOption, PdfFileKind } from '@/entities/pdf-file/model/types';

import 'server-only';

import { getPdfFileAvailability } from './get-pdf-file-availability';

/**
 * 공개 페이지에서 사용할 PDF 다운로드 옵션 목록을 반환합니다.
 * 각 자산은 고정 파일명 기준으로 유지하고, 실제 업로드 여부에 따라 href만 비웁니다.
 */
export const getPdfFileDownloadOptions = async (
  kind: PdfFileKind,
): Promise<PdfFileDownloadOption[]> => {
  const storageConfigs = listPdfFileAssetStorageConfigsByKind(kind);

  return Promise.all(
    storageConfigs.map(async storageConfig => {
      const isReady = await getPdfFileAvailability({
        assetKey: storageConfig.assetKey,
      }).catch(() => false);

      return {
        assetKey: storageConfig.assetKey,
        fileName: storageConfig.downloadFileName,
        href: isReady ? buildPdfFileAssetDownloadPath(storageConfig.assetKey) : null,
        locale: storageConfig.locale,
      };
    }),
  );
};
