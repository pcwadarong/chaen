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

/**
 * 아티클 댓글 캐시 무효화에 사용하는 공통 태그입니다.
 */
export const ARTICLE_COMMENTS_CACHE_TAG = 'article-comments';

/**
 * 특정 아티클의 댓글 목록 캐시 태그를 생성합니다.
 */
export const createArticleCommentsCacheTag = (articleId: string) => `article-comments:${articleId}`;

/**
 * 특정 댓글 캐시 태그를 생성합니다.
 */
export const createArticleCommentCacheTag = (commentId: string) => `article-comment:${commentId}`;
