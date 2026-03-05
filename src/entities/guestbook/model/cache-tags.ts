/**
 * 방명록 목록 캐시 무효화에 사용하는 공통 태그입니다.
 */
export const GUESTBOOK_CACHE_TAG = 'guestbook';

/**
 * 방명록 단일 항목 캐시 무효화 태그를 생성합니다.
 */
export const createGuestbookEntryCacheTag = (entryId: string) => `guestbook:${entryId}`;

/**
 * 특정 원댓글의 대댓글 목록 캐시 무효화 태그를 생성합니다.
 */
export const createGuestbookRepliesCacheTag = (parentId: string) => `guestbook:replies:${parentId}`;
