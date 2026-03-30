import {
  ARTICLE_COMMENTS_CACHE_TTL_MS,
  cacheArticleCommentsPage,
  DEFAULT_INITIAL_PAGE,
  getCachedArticleCommentsPage,
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
    resetArticleCommentsPageCacheForTest();
    vi.useRealTimers();
  });

  it('articleId/page/sort 기준으로 캐시를 저장하고 조회한다', () => {
    cacheArticleCommentsPage(pageData, 'article-1');

    expect(
      getCachedArticleCommentsPage({
        articleId: 'article-1',
        page: 1,
        sort: 'latest',
      }),
    ).toEqual(pageData);
  });

  it('다른 page나 sort에는 캐시를 재사용하지 않는다', () => {
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

  it('TTL이 지난 캐시는 null을 반환한다', () => {
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

  it('TTL 이내에 저장된 캐시는 계속 반환한다', () => {
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

  it('TTL이 지난 캐시를 조회한 뒤 새로 저장하면 새 데이터를 반환한다', () => {
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
