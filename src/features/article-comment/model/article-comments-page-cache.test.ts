// @vitest-environment node
import {
  ARTICLE_COMMENTS_CACHE_TTL_MS,
  cacheArticleCommentsPage,
  DEFAULT_INITIAL_PAGE,
  getCachedArticleCommentsPage,
  invalidateArticleCommentsCache,
  resetArticleCommentsPageCacheForTest,
} from '@/features/article-comment/model/article-comments-page-cache';

const pageData = {
  ...DEFAULT_INITIAL_PAGE,
  items: [
    {
      article_id: 'article-1',
      author_blog_url: null,
      author_name: 'chaen',
      content: 'cached comment',
      created_at: '2026-03-17T00:00:00.000Z',
      deleted_at: null,
      id: 'comment-1',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      replies: [],
      updated_at: '2026-03-17T00:00:00.000Z',
    },
  ],
};

describe('article comments page cache', () => {
  beforeEach(() => {
    Object.assign(globalThis, { window: globalThis });
    resetArticleCommentsPageCacheForTest();
    vi.useRealTimers();
  });

  it('articleId/page/sort 조건이 일치할 때, getCachedArticleCommentsPage는 저장된 데이터를 반환해야 한다', () => {
    cacheArticleCommentsPage(pageData, 'article-1');

    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 1,
        sort: 'latest',
      }),
    ).toEqual(pageData);
  });

  it('다른 page나 sort 조건일 때, getCachedArticleCommentsPage는 null을 반환해야 한다', () => {
    cacheArticleCommentsPage(pageData, 'article-1');

    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 2,
        sort: 'latest',
      }),
    ).toBeNull();
    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 1,
        sort: 'oldest',
      }),
    ).toBeNull();
  });

  it('TTL이 초과된 캐시 상태에서, getCachedArticleCommentsPage는 null을 반환하고 항목을 삭제해야 한다', () => {
    vi.useFakeTimers();
    cacheArticleCommentsPage(pageData, 'article-1');

    vi.advanceTimersByTime(ARTICLE_COMMENTS_CACHE_TTL_MS + 1);

    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 1,
        sort: 'latest',
      }),
    ).toBeNull();
  });

  it('TTL 이내의 캐시 상태에서, getCachedArticleCommentsPage는 저장된 데이터를 계속 반환해야 한다', () => {
    vi.useFakeTimers();
    cacheArticleCommentsPage(pageData, 'article-1');

    vi.advanceTimersByTime(ARTICLE_COMMENTS_CACHE_TTL_MS - 1);

    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 1,
        sort: 'latest',
      }),
    ).toEqual(pageData);
  });

  it('특정 articleId로 invalidation을 호출할 때, 해당 article의 캐시는 모두 삭제되고 다른 article의 캐시는 유지되어야 한다', () => {
    cacheArticleCommentsPage({ ...pageData, page: 1, sort: 'latest' }, 'article-1');
    cacheArticleCommentsPage({ ...pageData, page: 1, sort: 'oldest' }, 'article-1');
    cacheArticleCommentsPage({ ...pageData, page: 1, sort: 'latest' }, 'article-2');

    invalidateArticleCommentsCache('article-1');

    expect(
      getCachedArticleCommentsPage({ articleId: 'article-1', page: 1, sort: 'latest' }),
    ).toBeNull();
    expect(
      getCachedArticleCommentsPage({ articleId: 'article-1', page: 1, sort: 'oldest' }),
    ).toBeNull();
    expect(
      getCachedArticleCommentsPage({ articleId: 'article-2', page: 1, sort: 'latest' }),
    ).not.toBeNull();
  });

  it('TTL 초과 항목 조회 후 새 데이터를 저장할 때, getCachedArticleCommentsPage는 새 데이터를 반환해야 한다', () => {
    vi.useFakeTimers();
    cacheArticleCommentsPage(pageData, 'article-1');

    vi.advanceTimersByTime(ARTICLE_COMMENTS_CACHE_TTL_MS + 1);

    // 만료 항목 조회 → null 반환 (내부 삭제)
    expect(
      getCachedArticleCommentsPage({ articleId: 'article-1', page: 1, sort: 'latest' }),
    ).toBeNull();

    // 새 데이터로 다시 저장하면 조회 가능해야 한다
    const updatedPageData = { ...pageData, totalCount: 5 };
    cacheArticleCommentsPage(updatedPageData, 'article-1');

    expect(
      getCachedArticleCommentsPage({ articleId: 'article-1', page: 1, sort: 'latest' }),
    ).toEqual(updatedPageData);
  });
});
