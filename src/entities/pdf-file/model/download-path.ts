import type {
  PdfFileAssetKey,
  PdfFileDownloadSource,
  PdfFileKind,
} from '@/entities/pdf-file/model/types';

type BuildPdfFileAssetDownloadPathOptions = {
  source?: PdfFileDownloadSource;
};

/**
 * PDF signed 다운로드를 위임하는 내부 API 경로를 생성합니다.
 */
export const buildPdfFileDownloadPath = (kind: PdfFileKind): string => `/api/pdf/${kind}`;

/**
 * 관리자에서 특정 PDF 자산의 signed 다운로드를 확인하는 내부 API 경로를 생성합니다.
 */
export const buildPdfFileAssetDownloadPath = (
  assetKey: PdfFileAssetKey,
  options?: BuildPdfFileAssetDownloadPathOptions,
): string => {
  const searchParams = new URLSearchParams();

  if (options?.source) {
    searchParams.set('source', options.source);
  }

  const serializedSearchParams = searchParams.toString();
  if (!serializedSearchParams) return `/api/pdf/file/${assetKey}`;

  return `/api/pdf/file/${assetKey}?${serializedSearchParams}`;
};
