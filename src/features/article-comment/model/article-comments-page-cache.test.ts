import {
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
});
