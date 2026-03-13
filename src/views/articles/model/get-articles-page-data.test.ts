import { vi } from 'vitest';

import { getArticles, getResolvedArticlesFirstPage } from '@/entities/article/api/get-articles';
import { getPopularArticleTags } from '@/entities/article/api/get-popular-article-tags';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';

import {
  buildArticlesPageHref,
  getArticlesPageData,
  normalizePageParams,
  normalizeSearchParams,
  normalizeTagParams,
} from './get-articles-page-data';

vi.mock('@/entities/article/api/get-articles', () => ({
  getArticles: vi.fn(),
  getResolvedArticlesFirstPage: vi.fn(),
}));

vi.mock('@/entities/article/api/get-popular-article-tags', () => ({
  getPopularArticleTags: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagLabelMapBySlugs: vi.fn(),
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
    vi.mocked(getPopularArticleTags).mockResolvedValue([
      {
        article_count: 5,
        tag: 'nextjs',
      },
    ]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map([['nextjs', 'Next.js']]),
      schemaMissing: false,
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
      pagination: {
        currentPage: 1,
        nextHref: '/ko/articles?q=react&page=2',
        previousHref: null,
      },
      popularTags: [
        {
          article_count: 5,
          label: 'Next.js',
          tag: 'nextjs',
        },
      ],
      searchQuery: 'react',
    });
  });

  it('아티클 조회 실패 시 에러를 그대로 전파한다', async () => {
    vi.mocked(getResolvedArticlesFirstPage).mockRejectedValue(new Error('temporary failure'));
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
    });

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

  it('태그 searchParams도 첫 번째 값만 trim하여 사용한다', async () => {
    vi.mocked(getResolvedArticlesFirstPage).mockResolvedValue({
      page: {
        items: [],
        nextCursor: null,
        totalCount: 0,
      },
      resolvedLocale: 'ko',
    });
    vi.mocked(getPopularArticleTags).mockResolvedValue([]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
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
        locale: 'ko',
        page: 2,
        query: 'react',
        tag: 'nextjs',
      }),
    ).toBe('/ko/articles?q=react&page=2');
    expect(buildArticlesPageHref({ locale: 'ko', page: 3, tag: ' NextJS ' })).toBe(
      '/ko/articles?tag=nextjs&page=3',
    );
  });

  it('요청한 페이지까지 순차 조회하고 fallback locale을 다음 페이지 요청에 재사용한다', async () => {
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
        totalCount: null,
      },
      resolvedLocale: 'ko',
    });
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
    vi.mocked(getPopularArticleTags).mockResolvedValue([]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
    });

    const data = await getArticlesPageData({
      locale: 'fr',
      page: 2,
      query: undefined,
      tag: undefined,
    });

    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      locale: 'ko',
      query: '',
      tag: '',
    });
    expect(data.feedLocale).toBe('ko');
    expect(data.pagination).toEqual({
      currentPage: 2,
      nextHref: '/fr/articles?page=3',
      previousHref: '/fr/articles',
    });
    expect(data.initialItems[0]?.id).toBe('article-2');
  });
});
