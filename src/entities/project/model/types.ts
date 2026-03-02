/**
 * Supabase `projects` 테이블 1개 레코드 타입입니다.
 */
export type Project = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  thumbnail_url: string | null;
  gallery_urls: string[] | null;
  tags: string[] | null;
  created_at: string;
  period_start?: string | null;
  period_end?: string | null;
};
