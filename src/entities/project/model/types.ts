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

/**
 * 프로젝트 상세 좌측 아카이브 목록에 필요한 최소 요약 타입입니다.
 */
export type ProjectDetailListItem = Pick<Project, 'id' | 'title' | 'description' | 'created_at'>;

/**
 * 프로젝트 목록 카드/피드에 필요한 요약 타입입니다.
 */
export type ProjectListItem = Pick<
  Project,
  'id' | 'title' | 'description' | 'thumbnail_url' | 'created_at'
>;
