import type { PdfFileKind } from '@/entities/pdf-file/model/types';

/**
 * PDF 관련 서버 조회 전체를 무효화할 때 사용하는 공통 태그입니다.
 */
export const PDF_FILES_CACHE_TAG = 'pdf-files';

/**
 * PDF 소개 콘텐츠 조회 무효화에 사용하는 공통 태그입니다.
 */
export const PDF_FILE_CONTENT_CACHE_TAG = 'pdf-file-content';

/**
 * PDF 파일 존재 여부 조회 무효화용 태그를 생성합니다.
 */
export const createPdfFileAvailabilityCacheTag = (kind: PdfFileKind) =>
  `pdf-file-availability:${kind}`;

/**
 * PDF 소개 콘텐츠 조회 무효화용 태그를 생성합니다.
 */
export const createPdfFileContentCacheTag = (kind: PdfFileKind) => `pdf-file-content:${kind}`;
