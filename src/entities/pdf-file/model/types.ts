/**
 * PDF 소개 콘텐츠의 종류입니다.
 * - `resume`: 이력서 페이지에서 사용하는 소개 콘텐츠
 * - `portfolio`: 프로젝트 페이지에서 사용하는 소개 콘텐츠
 */
export type PdfFileKind = 'resume' | 'portfolio';

/**
 * PDF 자산의 파일명/다운로드 변형을 구분하는 locale 키입니다.
 * - `ko`: 국문 파일명 자산
 * - `en`: 영문 파일명 자산
 */
export type PdfFileAssetLocale = 'ko' | 'en';

/**
 * 관리자에서 개별 업로드/다운로드 확인 대상으로 관리하는 PDF 자산 키입니다.
 */
export type PdfFileAssetKey = 'resume-ko' | 'resume-en' | 'portfolio-ko' | 'portfolio-en';

/**
 * 공개 페이지에서 사용하는 PDF 다운로드 옵션입니다.
 */
export type PdfFileDownloadOption = {
  assetKey: PdfFileAssetKey;
  fileName: string;
  href: string | null;
  locale: PdfFileAssetLocale;
};

/**
 * 주어진 문자열이 지원하는 PDF 파일 종류인지 확인합니다.
 */
export const isPdfFileKind = (value: string): value is PdfFileKind =>
  value === 'resume' || value === 'portfolio';

/**
 * 주어진 문자열이 지원하는 PDF 자산 키인지 확인합니다.
 */
export const isPdfFileAssetKey = (value: string): value is PdfFileAssetKey =>
  value === 'resume-ko' ||
  value === 'resume-en' ||
  value === 'portfolio-ko' ||
  value === 'portfolio-en';

/**
 * Supabase의 PDF 소개 콘텐츠 테이블에서 사용하는 레코드 타입입니다.
 */
export type PdfFileContent = {
  locale: string;
  title: string;
  description: string;
  body: string;
  download_button_label: string;
  download_unavailable_label: string;
  updated_at: string;
};
