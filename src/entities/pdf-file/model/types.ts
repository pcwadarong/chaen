/**
 * PDF 소개 콘텐츠의 종류입니다.
 * - `resume`: 이력서 페이지에서 사용하는 소개 콘텐츠
 * - `portfolio`: 프로젝트 페이지에서 사용하는 소개 콘텐츠
 */
export type PdfFileKind = 'resume' | 'portfolio';

/**
 * 주어진 문자열이 지원하는 PDF 파일 종류인지 확인합니다.
 */
export const isPdfFileKind = (value: string): value is PdfFileKind =>
  value === 'resume' || value === 'portfolio';

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
