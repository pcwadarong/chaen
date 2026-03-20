import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { listPdfFileAssetStorageConfigs } from '@/entities/pdf-file/model/config';
import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

type AdminPdfAvailabilityResponse = {
  items: Array<{
    assetKey: PdfFileAssetKey;
    isPdfReady: boolean;
  }>;
};

/**
 * 관리자 PDF 패널에서 사용하는 자산별 준비 상태를 한 번에 반환합니다.
 * SSR 대신 hydration 이후 상태 확인으로 전환할 때 사용합니다.
 */
export const GET = async () =>
  runJsonRoute<AdminPdfAvailabilityResponse>({
    action: async () => ({
      items: await Promise.all(
        listPdfFileAssetStorageConfigs().map(async storageConfig => ({
          assetKey: storageConfig.assetKey,
          isPdfReady: await getPdfFileAvailability({
            assetKey: storageConfig.assetKey,
          }).catch(() => false),
        })),
      ),
    }),
    adminOnly: true,
    errorMessage: 'Failed to load admin PDF availability',
  });
