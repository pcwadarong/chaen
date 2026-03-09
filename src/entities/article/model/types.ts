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
  view_count?: number | null;
};

/**
 * 아티클 상세 좌측 아카이브 목록에 필요한 최소 요약 타입입니다.
 */
export type ArticleDetailListItem = Pick<Article, 'id' | 'title' | 'description' | 'created_at'>;

/**
 * 아티클 상세 좌측 아카이브 목록의 cursor 기반 페이지 응답입니다.
 */
export type ArticleArchivePage = {
  items: ArticleDetailListItem[];
  nextCursor: string | null;
};

/**
 * 아티클 목록 카드/피드에 필요한 요약 타입입니다.
 */
export type ArticleListItem = Pick<
  Article,
  'id' | 'title' | 'description' | 'thumbnail_url' | 'created_at'
>;

/**
 * 아티클 목록 페이지의 cursor 기반 응답입니다.
 */
export type ArticleListPage = {
  items: ArticleListItem[];
  nextCursor: string | null;
  totalCount: number | null;
};

/**
 * 아티클 목록 우측 패널에서 사용하는 인기 태그 집계 타입입니다.
 */
export type ArticleTagStat = {
  article_count: number;
  tag: string;
};

/**
 * locale별 label이 결합된 아티클 태그 집계 타입입니다.
 */
export type LocalizedArticleTagStat = ArticleTagStat & {
  label: string;
};
