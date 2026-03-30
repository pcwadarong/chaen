import type { ArticleCommentPage, ArticleCommentsSort } from '@/entities/article/comment/model';

type CachedEntry = {
  cachedAt: number;
  data: ArticleCommentPage;
};

const articleCommentsPageCache = new Map<string, CachedEntry>();

export const DEFAULT_INITIAL_PAGE: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
};

/** 브라우저 세션 메모리 캐시 유효 시간 (밀리초) */
export const ARTICLE_COMMENTS_CACHE_TTL_MS = 60_000;

/**
 * 댓글 페이지 캐시 키를 생성합니다.
 */
const createArticleCommentsPageCacheKey = ({
  articleId,
  page,
  sort,
}: {
  articleId: string;
  page: number;
  sort: ArticleCommentsSort;
}) => `${articleId}:${sort}:${page}`;

/**
 * 브라우저 세션 메모리에서 댓글 페이지 캐시를 조회합니다.
 *
 * TTL이 지난 항목은 null을 반환하고 캐시에서 제거합니다.
 */
export const getCachedArticleCommentsPage = ({
  articleId,
  page,
  sort,
}: {
  articleId: string;
  page: number;
  sort: ArticleCommentsSort;
}) => {
  if (typeof window === 'undefined') return null;

  const key = createArticleCommentsPageCacheKey({ articleId, page, sort });
  const entry = articleCommentsPageCache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.cachedAt > ARTICLE_COMMENTS_CACHE_TTL_MS) {
    articleCommentsPageCache.delete(key);
    return null;
  }

  return entry.data;
};

/**
 * 브라우저 세션 메모리에 댓글 페이지를 저장합니다.
 */
export const cacheArticleCommentsPage = (pageData: ArticleCommentPage, articleId: string) => {
  if (typeof window === 'undefined') return;

  articleCommentsPageCache.set(
    createArticleCommentsPageCacheKey({
      articleId,
      page: pageData.page,
      sort: pageData.sort,
    }),
    {
      cachedAt: Date.now(),
      data: pageData,
    },
  );
};

/**
 * 특정 article의 모든 댓글 페이지 캐시를 삭제합니다.
 *
 * 댓글 작성/수정/삭제 성공 직후 호출해 stale 데이터가 재사용되지 않도록 합니다.
 */
export const invalidateArticleCommentsCache = (articleId: string) => {
  if (typeof window === 'undefined') return;

  const prefix = `${articleId}:`;

  for (const key of Array.from(articleCommentsPageCache.keys())) {
    if (key.startsWith(prefix)) articleCommentsPageCache.delete(key);
  }
};

/**
 * 테스트에서 댓글 페이지 메모리 캐시를 초기화합니다.
 */
export const resetArticleCommentsPageCacheForTest = () => {
  articleCommentsPageCache.clear();
};
