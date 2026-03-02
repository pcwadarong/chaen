/**
 * Supabase `resume_contents` 테이블 레코드 타입입니다.
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
