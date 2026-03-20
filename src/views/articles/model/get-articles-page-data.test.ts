import { vi } from 'vitest';

import {
  getArticles,
  getResolvedArticlesFirstPage,
} from '@/entities/article/api/list/get-articles';
import {
  buildArticlesPageHref,
  getArticlesPageData,
  isSupportedArticlesPageRequest,
  normalizeCursorHistoryParams,
  normalizeCursorParams,
  normalizePageParams,
  normalizeSearchParams,
  normalizeTagParams,
} from '@/views/articles/model/get-articles-page-data';

vi.mock('@/entities/article/api/list/get-articles', () => ({
  getArticles: vi.fn(),
  getResolvedArticlesFirstPage: vi.fn(),
}));

describe('getArticlesPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('아티클 목록 초기 페이지 데이터를 컨테이너 props 형태로 반환한다', async () => {
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
        nextCursor: '12',
        totalCount: 1,
      },
      resolvedLocale: 'ko',
    });

    const data = await getArticlesPageData({ locale: 'ko', page: 1, query: 'react' });

    expect(getResolvedArticlesFirstPage).toHaveBeenCalledWith({
      locale: 'ko',
      query: 'react',
      tag: '',
    });
    expect(data).toEqual({
      activeTag: '',
      feedLocale: 'ko',
      initialCursor: '12',
      initialItems: expect.any(Array),
      locale: 'ko',
      pagination: {
        currentPage: 1,
        nextHref: '/ko/articles?q=react&page=2&cursor=12',
        previousHref: null,
      },
      searchQuery: 'react',
    });
  });

  it('아티클 조회 실패 시 에러를 그대로 전파한다', async () => {
    vi.mocked(getResolvedArticlesFirstPage).mockRejectedValue(new Error('temporary failure'));

    await expect(getArticlesPageData({ locale: 'ko', page: 1, query: '' })).rejects.toThrow(
      'temporary failure',
    );
  });

  it('배열 searchParams는 첫 번째 값만 trim하여 사용한다', () => {
    expect(normalizeSearchParams([' react ', 'vue'])).toBe('react');
  });

  it('비어 있거나 없는 searchParams는 빈 문자열로 정규화한다', () => {
    expect(normalizeSearchParams('   ')).toBe('');
    expect(normalizeSearchParams(undefined)).toBe('');
  });

  it('비어 있거나 없는 tag searchParams는 빈 문자열로 정규화한다', () => {
    expect(normalizeTagParams('   ')).toBe('');
    expect(normalizeTagParams(undefined)).toBe('');
  });

  it('cursor searchParams는 첫 번째 문자열만 trim하여 사용한다', () => {
    expect(normalizeCursorParams([' cursor-1 ', 'cursor-2'])).toBe('cursor-1');
    expect(normalizeCursorParams('   ')).toBeNull();
  });

  it('cursorHistory searchParams는 첫 번째 문자열을 cursor 배열로 정규화한다', () => {
    expect(normalizeCursorHistoryParams([' cursor-1,cursor-2 ', 'cursor-3'])).toEqual([
      'cursor-1',
      'cursor-2',
    ]);
    expect(normalizeCursorHistoryParams(undefined)).toEqual([]);
  });

  it('태그 searchParams도 첫 번째 값만 trim하여 사용한다', async () => {
    vi.mocked(getResolvedArticlesFirstPage).mockResolvedValue({
      page: {
        items: [],
        nextCursor: null,
        totalCount: 0,
      },
      resolvedLocale: 'ko',
    });

    const data = await getArticlesPageData({
      locale: 'ko',
      page: 1,
      query: undefined,
      tag: [' NextJS ', 'react'],
    });

    expect(getResolvedArticlesFirstPage).toHaveBeenCalledWith({
      locale: 'ko',
      query: '',
      tag: 'nextjs',
    });
    expect(data.activeTag).toBe('nextjs');
  });

  it('page searchParams를 양의 정수로 정규화한다', () => {
    expect(normalizePageParams([' 2 ', '3'])).toBe(2);
    expect(normalizePageParams(undefined)).toBe(1);
    expect(normalizePageParams('')).toBe(1);
  });

  it('유효하지 않은 page searchParams는 null을 반환한다', () => {
    expect(normalizePageParams('0')).toBeNull();
    expect(normalizePageParams('-1')).toBeNull();
    expect(normalizePageParams('abc')).toBeNull();
  });

  it('아티클 페이지 href는 1페이지를 생략하고 query 우선 규칙을 따른다', () => {
    expect(buildArticlesPageHref({ locale: 'ko', page: 1 })).toBe('/ko/articles');
    expect(
      buildArticlesPageHref({
        cursor: 'cursor-1',
        cursorHistory: ['cursor-root'],
        locale: 'ko',
        page: 2,
        query: 'react',
        tag: 'nextjs',
      }),
    ).toBe('/ko/articles?q=react&page=2&cursor=cursor-1&cursorHistory=cursor-root');
    expect(buildArticlesPageHref({ locale: 'ko', page: 3, tag: ' NextJS ' })).toBe(
      '/ko/articles?tag=nextjs&page=3',
    );
  });

  it('cursor가 있으면 요청한 페이지를 한 번에 조회한다', async () => {
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

    const data = await getArticlesPageData({
      cursor: 'cursor-1',
      cursorHistory: undefined,
      locale: 'fr',
      page: 2,
      query: undefined,
      tag: undefined,
    });

    expect(getResolvedArticlesFirstPage).not.toHaveBeenCalled();
    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      locale: 'fr',
      query: '',
      tag: '',
    });
    expect(data.pagination).toEqual({
      currentPage: 2,
      nextHref: '/fr/articles?page=3&cursor=cursor-2&cursorHistory=cursor-1',
      previousHref: '/fr/articles',
    });
    expect(data.initialItems[0]?.id).toBe('article-2');
  });

  it('2페이지 이상은 cursor가 있을 때만 지원한다', () => {
    expect(isSupportedArticlesPageRequest({ cursor: undefined, page: 1 })).toBe(true);
    expect(isSupportedArticlesPageRequest({ cursor: 'cursor-1', page: 2 })).toBe(true);
    expect(isSupportedArticlesPageRequest({ cursor: undefined, page: 2 })).toBe(false);
  });
});
