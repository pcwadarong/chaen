import type { ArticleCommentPage, ArticleCommentsSort } from '@/entities/article/comment/model';

const articleCommentsPageCache = new Map<string, ArticleCommentPage>();

export const DEFAULT_INITIAL_PAGE: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
};

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

  return (
    articleCommentsPageCache.get(
      createArticleCommentsPageCacheKey({
        articleId,
        page,
        sort,
      }),
    ) ?? null
  );
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
    pageData,
  );
};

/**
 * 테스트에서 댓글 페이지 메모리 캐시를 초기화합니다.
 */
export const resetArticleCommentsPageCacheForTest = () => {
  articleCommentsPageCache.clear();
};
