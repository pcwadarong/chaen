import type { PdfFileKind } from '@/entities/pdf-file/model/types';

/**
 * PDF signed 다운로드를 위임하는 내부 API 경로를 생성합니다.
 */
export const buildPdfFileDownloadPath = (kind: PdfFileKind): string => `/api/pdf/${kind}`;
