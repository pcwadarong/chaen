/**
 * Supabase `articles` 테이블 1개 레코드 타입입니다.
 */
export type Article = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  slug?: string | null;
  visibility?: 'public' | 'private' | null;
  allow_comments?: boolean | null;
  publish_at?: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at?: string | null;
  view_count?: number | null;
};

/**
 * 아티클 상세 좌측 아카이브 목록에 필요한 최소 요약 타입입니다.
 */
export type ArticleDetailListItem = Pick<
  Article,
  'id' | 'title' | 'description' | 'publish_at' | 'slug'
>;

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
  'id' | 'title' | 'description' | 'thumbnail_url' | 'publish_at' | 'slug'
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
 * 관리자 콘텐츠 리스트에서 사용하는 아티클 요약 타입입니다.
 */
export type AdminArticleListItem = Pick<
  Article,
  | 'created_at'
  | 'id'
  | 'publish_at'
  | 'slug'
  | 'thumbnail_url'
  | 'updated_at'
  | 'view_count'
  | 'visibility'
> & {
  title: string;
};

/**
 * 관리자 대시보드에서 Google Search Console 기준 아티클 유입 행을 표현합니다.
 */
export type AdminGoogleArticleTrafficItem = {
  clicks: number;
  ctr: number;
  impressions: number;
  path: string;
  position: number;
  url: string;
};

/**
 * 관리자 대시보드에서 Google Search Console 아티클 유입 패널이 사용하는 상태입니다.
 */
export type AdminGoogleArticleTraffic = {
  items: AdminGoogleArticleTrafficItem[];
  message?: string;
  siteUrl?: string;
  status: 'configured' | 'error' | 'not_configured';
  totalClicks: number;
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

export type ArticleCommentsSort = 'latest' | 'oldest';

/**
 * Supabase `article_comments` 원본 row 타입입니다.
 */
export type ArticleCommentRow = {
  article_id: string;
  author_blog_url: string | null;
  author_name: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  id: string;
  parent_id: string | null;
  password_hash: string | null;
  reply_to_author_name: string | null;
  reply_to_comment_id: string | null;
  updated_at: string;
};

/**
 * 클라이언트에 공개되는 댓글 타입입니다.
 */
export type ArticleComment = Omit<ArticleCommentRow, 'password_hash'>;

/**
 * 루트 댓글과 대댓글 묶음 타입입니다.
 */
export type ArticleCommentThreadItem = ArticleComment & {
  replies: ArticleComment[];
};

/**
 * 아티클 댓글 페이지 응답 타입입니다.
 */
export type ArticleCommentPage = {
  items: ArticleCommentThreadItem[];
  page: number;
  pageSize: number;
  sort: ArticleCommentsSort;
  totalCount: number;
  totalPages: number;
};
