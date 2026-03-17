import {
  buildPdfFileDownloadPath,
  getPdfFileAvailability,
  type PdfFileKind,
} from '@/entities/pdf-file';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload/model/admin-pdf-upload.types';

import 'server-only';

type DashboardPageData = {
  pdfUploadItems: AdminPdfUploadItem[];
};

const DASHBOARD_PDF_UPLOAD_ORDER: PdfFileKind[] = ['resume', 'portfolio'];

const DASHBOARD_PDF_UPLOAD_COPY: Record<
  PdfFileKind,
  {
    description: string;
    title: string;
  }
> = {
  portfolio: {
    description: '프로젝트 페이지에서 노출되는 포트폴리오 PDF를 교체합니다.',
    title: '포트폴리오 PDF',
  },
  resume: {
    description: '이력서 페이지에서 노출되는 resume PDF를 교체합니다.',
    title: '이력서 PDF',
  },
};

/**
 * 관리자 대시보드에서 사용할 PDF 업로드 카드 데이터를 조합합니다.
 * 고정 파일명은 env 설정을 우선 사용하고, 파일 존재 여부는 storage cached read 결과를 반영합니다.
 */
export const getDashboardPageData = async (): Promise<DashboardPageData> => {
  const pdfUploadItems = await Promise.all(
    DASHBOARD_PDF_UPLOAD_ORDER.map(async kind => {
      const storageConfig = getPdfFileStorageConfig(kind);
      const isPdfReady = await getPdfFileAvailability({
        kind,
      }).catch(() => false);

      return {
        description: DASHBOARD_PDF_UPLOAD_COPY[kind].description,
        downloadFileName: storageConfig.downloadFileName,
        downloadPath: buildPdfFileDownloadPath(kind),
        filePath: storageConfig.filePath,
        isPdfReady,
        kind,
        title: DASHBOARD_PDF_UPLOAD_COPY[kind].title,
      } satisfies AdminPdfUploadItem;
    }),
  );

  return {
    pdfUploadItems,
  };
};
