import type { PdfFileAssetKey, PdfFileKind } from '@/entities/pdf-file/model/types';

/**
 * PDF signed 다운로드를 위임하는 내부 API 경로를 생성합니다.
 */
export const buildPdfFileDownloadPath = (kind: PdfFileKind): string => `/api/pdf/${kind}`;

/**
 * 관리자에서 특정 PDF 자산의 signed 다운로드를 확인하는 내부 API 경로를 생성합니다.
 */
export const buildPdfFileAssetDownloadPath = (assetKey: PdfFileAssetKey): string =>
  `/api/pdf/file/${assetKey}`;
