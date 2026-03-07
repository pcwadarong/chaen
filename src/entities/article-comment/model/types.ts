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
  is_secret: boolean;
  parent_id: string | null;
  password_hash: string | null;
  reply_to_author_name: string | null;
  reply_to_comment_id: string | null;
  updated_at: string;
};

/**
 * 클라이언트에 공개되는 댓글 타입입니다.
 * 비밀글이 잠겨 있으면 `content`는 빈 문자열로 전달됩니다.
 */
export type ArticleComment = Omit<ArticleCommentRow, 'password_hash'> & {
  is_content_masked?: boolean;
};

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
