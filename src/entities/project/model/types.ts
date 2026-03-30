import type { TechStack } from '@/entities/tech-stack/model/types';

/**
 * Supabase `projects` 테이블 1개 레코드 타입입니다.
 */
export type Project = {
  created_at: string;
  description: string | null;
  display_order?: number | null;
  content: string | null;
  github_url?: string | null;
  id: string;
  period_end?: string | null;
  period_start?: string | null;
  publish_at?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  tech_stacks?: TechStack[] | null;
  thumbnail_url: string | null;
  title: string;
  visibility?: 'public' | 'private' | null;
  website_url?: string | null;
};

/**
 * 프로젝트 상세 좌측 아카이브 목록에 필요한 최소 요약 타입입니다.
 */
export type ProjectDetailListItem = Pick<
  Project,
  'id' | 'title' | 'description' | 'publish_at' | 'slug'
>;

/**
 * 프로젝트 상세 좌측 아카이브 목록의 cursor 기반 페이지 응답입니다.
 */
export type ProjectArchivePage = {
  items: ProjectDetailListItem[];
  nextCursor: string | null;
};

/**
 * 프로젝트 목록 카드/피드에 필요한 요약 타입입니다.
 */
export type ProjectListItem = Pick<
  Project,
  | 'description'
  | 'id'
  | 'period_end'
  | 'period_start'
  | 'publish_at'
  | 'slug'
  | 'thumbnail_url'
  | 'title'
>;

/**
 * 프로젝트 목록 페이지의 cursor 기반 응답입니다.
 */
export type ProjectListPage = {
  items: ProjectListItem[];
  nextCursor: string | null;
};
