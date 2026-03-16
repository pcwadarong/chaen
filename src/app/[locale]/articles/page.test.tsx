import { isValidElement } from 'react';
import { vi } from 'vitest';

import ArticlesRoute, { generateMetadata } from '@/app/[locale]/articles/page';
import { getArticlesPageData } from '@/views/articles';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, string | number>) => {
    if (key === 'paginationTitle') {
      return `${values?.title} | ${values?.page}`;
    }

    return key;
  }),
}));

vi.mock('@/views/articles', () => ({
  buildArticlesPageHref: ({
    locale,
    page = 1,
    query,
    tag,
  }: {
    locale: string;
    page?: number;
    query?: string;
    tag?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (query?.trim()) searchParams.set('q', query.trim());
    if (!query?.trim() && tag?.trim()) searchParams.set('tag', tag.trim().toLowerCase());
    if (page > 1) searchParams.set('page', String(page));

    const serializedSearchParams = searchParams.toString();
    const pathname = `/${locale}/articles`;

    return serializedSearchParams ? `${pathname}?${serializedSearchParams}` : pathname;
  },
  getArticlesPageData: vi.fn(async () => ({
    activeTag: '',
    feedLocale: 'ko',
    initialCursor: null,
    initialItems: [],
    locale: 'ko',
    pagination: {
      currentPage: 1,
      nextHref: '/ko/articles?page=2',
      previousHref: null,
    },
    popularTags: [],
    searchQuery: '',
  })),
  normalizePageParams: (page: string | string[] | undefined) => {
    const value = Array.isArray(page) ? page[0] : page;
    const normalizedValue = value?.trim();

    if (!normalizedValue) return 1;
    if (!/^\d+$/.test(normalizedValue)) return null;

    const parsedPage = Number(normalizedValue);

    return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : null;
  },
  ArticlesPage: function ArticlesPage() {
    return null;
  },
}));

describe('ArticlesRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    vi.clearAllMocks();
  });

  it('아티클 뷰 엔트리와 아티클 목록 데이터를 반환한다', async () => {
    vi.mocked(getArticlesPageData).mockResolvedValueOnce({
      activeTag: '',
      feedLocale: 'ko',
      initialCursor: null,
      initialItems: [],
      locale: 'ko',
      pagination: {
        currentPage: 2,
        nextHref: '/ko/articles?page=3',
        previousHref: '/ko/articles',
      },
      popularTags: [],
      searchQuery: '',
    });

    const element = await ArticlesRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
      searchParams: Promise.resolve({
        page: [' 2 '],
        q: [' react ', 'vue'],
        tag: [' nextjs ', 'react'],
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticlesPage');
    expect(getArticlesPageData).toHaveBeenCalledWith({
      locale: 'ko',
      page: 2,
      query: [' react ', 'vue'],
      tag: [' nextjs ', 'react'],
    });
    expect(element.props.initialItems).toEqual([]);
    expect(element.props.initialCursor).toBeNull();
    expect(element.props.feedLocale).toBe('ko');
    expect(element.props.locale).toBe('ko');
  });

  it('아티클 목록 메타데이터에 pagination prev/next를 포함한다', async () => {
    vi.mocked(getArticlesPageData).mockResolvedValueOnce({
      activeTag: '',
      feedLocale: 'ko',
      initialCursor: 'cursor-2',
      initialItems: [],
      locale: 'ko',
      pagination: {
        currentPage: 2,
        nextHref: '/ko/articles?page=3',
        previousHref: '/ko/articles',
      },
      popularTags: [],
      searchQuery: '',
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          locale: 'ko',
        }),
        searchParams: Promise.resolve({
          page: '2',
        }),
      }),
    ).resolves.toMatchObject({
      alternates: {
        canonical: 'https://chaen.dev/ko/articles?page=2',
      },
      pagination: {
        next: 'https://chaen.dev/ko/articles?page=3',
        previous: 'https://chaen.dev/ko/articles',
      },
      title: 'title | 2',
    });
  });

  it('유효하지 않은 page searchParam이면 notFound를 호출한다', async () => {
    await expect(
      ArticlesRoute({
        params: Promise.resolve({
          locale: 'ko',
        }),
        searchParams: Promise.resolve({
          page: '0',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('요청한 페이지에 도달하지 못하면 notFound를 호출한다', async () => {
    vi.mocked(getArticlesPageData).mockResolvedValueOnce({
      activeTag: '',
      feedLocale: 'ko',
      initialCursor: null,
      initialItems: [],
      locale: 'ko',
      pagination: {
        currentPage: 1,
        nextHref: null,
        previousHref: null,
      },
      popularTags: [],
      searchQuery: '',
    });

    await expect(
      ArticlesRoute({
        params: Promise.resolve({
          locale: 'ko',
        }),
        searchParams: Promise.resolve({
          page: '2',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
