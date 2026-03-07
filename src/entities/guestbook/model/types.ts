/**
 * Supabase `guestbook_entries` 원본 row 타입입니다.
 */
export type GuestbookEntryRow = {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_blog_url: string | null;
  password_hash: string | null;
  content: string;
  is_secret: boolean;
  is_admin_author?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * 클라이언트에 공개되는 방명록 항목(원댓글/대댓글 공통) 타입입니다.
 * 비밀글이 숨김 상태일 때는 `is_content_masked=true`이며 `content`는 빈 문자열입니다.
 */
export type GuestbookEntry = Omit<GuestbookEntryRow, 'password_hash'> & {
  is_content_masked?: boolean;
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
