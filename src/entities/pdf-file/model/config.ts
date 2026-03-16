import type { PdfFileContent, PdfFileKind } from '@/entities/pdf-file/model/types';
import { createStoragePath, STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';

type PdfFileStorageConfig = {
  bucket: string;
  filePath: string;
  downloadFileName: string;
};

type PdfFileContentConfig = {
  tableName: string;
};

const PDF_FILE_NAME_ENV_BY_KIND: Record<PdfFileKind, string | undefined> = {
  resume: process.env.NEXT_PUBLIC_RESUME_NAME,
  portfolio: process.env.NEXT_PUBLIC_PORTFOLIO_NAME,
};

const DEFAULT_PDF_FILE_NAME_BY_KIND: Record<PdfFileKind, string> = {
  resume: 'ParkChaewon-Resume.pdf',
  portfolio: 'ParkChaewon-Portfolio.pdf',
};

const PDF_FILE_BUCKET_BY_KIND: Record<PdfFileKind, string> = {
  resume: STORAGE_BUCKET.pdf,
  portfolio: STORAGE_BUCKET.pdf,
};

const SHARED_PDF_FILE_CONTENT_TABLE_NAME = 'resume_contents';

/**
 * PDF 종류별 Supabase Storage 설정을 반환합니다.
 * - `resume`: `pdf/{fileName}`
 * - `portfolio`: `pdf/{fileName}`
 */
export const getPdfFileStorageConfig = (kind: PdfFileKind): PdfFileStorageConfig => {
  const resolvedFileName = PDF_FILE_NAME_ENV_BY_KIND[kind] ?? DEFAULT_PDF_FILE_NAME_BY_KIND[kind];

  return {
    bucket: PDF_FILE_BUCKET_BY_KIND[kind],
    filePath: createStoragePath(resolvedFileName),
    downloadFileName: resolvedFileName,
  };
};

/**
 * PDF 소개 콘텐츠 조회 설정을 반환합니다.
 * 현재 소개 콘텐츠는 `resume_contents` 테이블을 공용으로 사용합니다.
 */
export const getPdfFileContentConfig = (_kind: PdfFileKind): PdfFileContentConfig => ({
  tableName: SHARED_PDF_FILE_CONTENT_TABLE_NAME,
});

const DEFAULT_PDF_FILE_CONTENT_UPDATED_AT = '1970-01-01T00:00:00.000Z';
const DEFAULT_PDF_FILE_CONTENT_TEXT = {
  title: '박채원 (Park Chaewon)',
  description: 'Web Frontend Developer',
  body: `사용자 경험을 시각적 설계와 공학적 구조로 완성하는 프론트엔드 개발자 입니다.
시각적 완성도와 성능 사이의 균형을 설계하며, 직관적이고 몰입도 높은 사용자 경험을 구현합니다.
사용자의 행동과 인지 흐름을 기준으로 인터랙션 구조를 설계하고,
렌더링 · 성능 · 접근성까지 고려해 경험의 완성도를 높입니다.
CS 기반의 문제 분석 역량을 바탕으로 구현 방식을 선택하며,
AI와 자동화 도구를 프로세스에 통합해 개발 효율과 품질을 함께 개선합니다.`,
  download_button_label: 'Download',
  download_unavailable_label: 'pdf Preparing',
} satisfies Omit<PdfFileContent, 'locale' | 'updated_at'>;

/**
 * PDF 소개 콘텐츠 조회 실패 시 사용할 기본값을 생성합니다.
 */
export const createDefaultPdfFileContent = (locale: string): PdfFileContent => ({
  locale: locale.toLowerCase().split('-')[0] ?? 'en',
  ...DEFAULT_PDF_FILE_CONTENT_TEXT,
  updated_at: DEFAULT_PDF_FILE_CONTENT_UPDATED_AT,
});
