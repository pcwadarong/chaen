import { vi } from 'vitest';

import {
  getArticles,
  getResolvedArticlesFirstPage,
} from '@/entities/article/api/list/get-articles';
import {
  buildArticleTagPageHref,
  getArticleTagPageData,
} from '@/views/articles/model/get-article-tag-page-data';

vi.mock('@/entities/article/api/list/get-articles', () => ({
  getArticles: vi.fn(),
  getResolvedArticlesFirstPage: vi.fn(),
}));

describe('getArticleTagPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('태그 첫 페이지 데이터를 태그 전용 props 형태로 반환한다', async () => {
    vi.mocked(getResolvedArticlesFirstPage).mockResolvedValue({
      page: {
        items: [
          {
            id: 'article-1',
            title: 'a1',
            description: 'd1',
            thumbnail_url: null,
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'article-1',
          },
        ],
        nextCursor: 'cursor-1',
        totalCount: 1,
      },
      resolvedLocale: 'en',
    });

    const data = await getArticleTagPageData({
      locale: 'en',
      page: 1,
      query: 'react',
      tag: ' Retrospect ',
    });

    expect(getResolvedArticlesFirstPage).toHaveBeenCalledWith({
      locale: 'en',
      query: 'react',
      tag: 'retrospect',
    });
    expect(data).toEqual({
      activeTag: 'retrospect',
      feedLocale: 'en',
      initialCursor: 'cursor-1',
      initialItems: expect.any(Array),
      locale: 'en',
      pagination: {
        currentPage: 1,
        nextHref: '/en/articles/tag/retrospect?q=react&page=2&cursor=cursor-1',
        previousHref: null,
      },
      searchQuery: 'react',
    });
  });

  it('cursor가 있으면 태그 페이지도 요청한 페이지를 바로 조회한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [
        {
          id: 'article-2',
          title: 'a2',
          description: 'd2',
          thumbnail_url: null,
          publish_at: '2026-02-28T00:00:00.000Z',
          slug: 'article-2',
        },
      ],
      nextCursor: 'cursor-2',
      totalCount: null,
    });

    const data = await getArticleTagPageData({
      cursor: 'cursor-1',
      cursorHistory: 'cursor-root',
      locale: 'fr',
      page: 2,
      query: undefined,
      tag: 'threejs',
    });

    expect(getResolvedArticlesFirstPage).not.toHaveBeenCalled();
    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      locale: 'fr',
      query: '',
      tag: 'threejs',
    });
    expect(data.pagination).toEqual({
      currentPage: 2,
      nextHref:
        '/fr/articles/tag/threejs?page=3&cursor=cursor-2&cursorHistory=cursor-root%2Ccursor-1',
      previousHref: '/fr/articles/tag/threejs?cursor=cursor-root',
    });
  });

  it('태그 페이지 href는 locale path와 query를 함께 직렬화한다', () => {
    expect(buildArticleTagPageHref({ locale: 'ko', tag: ' Retrospect ' })).toBe(
      '/ko/articles/tag/retrospect',
    );
    expect(
      buildArticleTagPageHref({
        cursor: 'cursor-1',
        cursorHistory: ['cursor-root'],
        locale: 'ja',
        page: 2,
        query: 'three',
        tag: 'ThreeJS',
      }),
    ).toBe('/ja/articles/tag/threejs?q=three&page=2&cursor=cursor-1&cursorHistory=cursor-root');
  });
});
