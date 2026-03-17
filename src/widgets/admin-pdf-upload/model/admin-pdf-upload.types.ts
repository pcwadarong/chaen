import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';

/**
 * 관리자 화면에서 개별 PDF 자산 행을 그릴 때 사용하는 업로드 항목 정보입니다.
 * `assetKey`는 자산 식별 키이고, `downloadFileName`은 고정 파일명,
 * `downloadPath`는 내부 다운로드 확인 경로, `filePath`는 storage 파일 경로,
 * `isPdfReady`는 현재 준비 여부, `title`은 관리자 UI에 표시할 제목입니다.
 */
export type AdminPdfUploadItem = {
  assetKey: PdfFileAssetKey;
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
  title: string;
};
