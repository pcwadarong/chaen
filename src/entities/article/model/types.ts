/**
 * Supabase `articles` 테이블 1개 레코드 타입입니다.
 */
export type Article = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at?: string | null;
};
