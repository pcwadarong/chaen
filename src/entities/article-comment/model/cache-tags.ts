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
