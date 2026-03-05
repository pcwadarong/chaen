/**
 * 방명록 1개 항목(원댓글/대댓글 공통) 타입입니다.
 */
export type GuestbookEntry = {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_blog_url: string | null;
  content: string;
  is_secret: boolean;
  is_admin_reply: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * 원댓글 + 대댓글 묶음 타입입니다.
 */
export type GuestbookThreadItem = GuestbookEntry & {
  replies: GuestbookEntry[];
};

/**
 * 무한스크롤 페이지네이션 결과 타입입니다.
 */
export type GuestbookThreadPage = {
  items: GuestbookThreadItem[];
  nextCursor: string | null;
};
