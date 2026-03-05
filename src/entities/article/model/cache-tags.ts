/**
 * 아티클 목록 캐시 무효화에 사용하는 공통 태그입니다.
 */
export const ARTICLES_CACHE_TAG = 'articles';

/**
 * 단일 아티클 캐시 무효화에 사용하는 태그를 생성합니다.
 */
export const createArticleCacheTag = (articleId: string) => `article:${articleId}`;
