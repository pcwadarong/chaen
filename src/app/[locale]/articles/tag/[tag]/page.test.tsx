import { isValidElement } from 'react';
import { vi } from 'vitest';

import ArticleTagRoute, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/articles/tag/[tag]/page';
import { getTagIdBySlug } from '@/entities/tag';
import { getArticleTagPageData } from '@/views/articles';

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

    if (key === 'tagPageDescription') {
      return `Articles tagged with ${values?.tag}`;
    }

    return key;
  }),
}));

vi.mock('@/entities/tag', () => ({
  getPublicArticleTagSlugs: vi.fn(async () => ({
    data: ['retrospect', 'react'],
    schemaMissing: false,
  })),
  getTagIdBySlug: vi.fn(async () => ({
    data: 'tag-retrospect',
    schemaMissing: false,
  })),
  getTagLabelMapBySlugs: vi.fn(async () => ({
    data: new Map([['retrospect', 'Retrospect']]),
    schemaMissing: false,
  })),
}));

vi.mock('@/views/articles', () => ({
  buildArticleTagPageHref: ({
    cursor,
    cursorHistory,
    locale,
    page = 1,
    query,
    tag,
  }: {
    cursor?: string | null;
    cursorHistory?: string[];
    locale: string;
    page?: number;
    query?: string;
    tag: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (query?.trim()) searchParams.set('q', query.trim());
    if (page > 1) searchParams.set('page', String(page));
    if (cursor) searchParams.set('cursor', cursor);
    if (cursorHistory?.length) searchParams.set('cursorHistory', cursorHistory.join(','));

    const serializedSearchParams = searchParams.toString();
    const pathname = `/${locale}/articles/tag/${tag.trim().toLowerCase()}`;

    return serializedSearchParams ? `${pathname}?${serializedSearchParams}` : pathname;
  },
  getArticleTagPageData: vi.fn(async () => ({
    activeTag: 'retrospect',
    feedLocale: 'en',
    initialCursor: null,
    initialItems: [],
    locale: 'en',
    pagination: {
      currentPage: 1,
      nextHref: '/en/articles/tag/retrospect?page=2',
      previousHref: null,
    },
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
  normalizeCursorParams: (cursor: string | string[] | undefined) => {
    const value = Array.isArray(cursor) ? cursor[0] : cursor;
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : null;
  },
  normalizeCursorHistoryParams: (cursorHistory: string | string[] | undefined) => {
    const value = Array.isArray(cursorHistory) ? cursorHistory[0] : cursorHistory;
    const normalizedValue = value?.trim();

    if (!normalizedValue) return [];

    return normalizedValue
      .split(',')
      .map(cursor => cursor.trim())
      .filter(Boolean);
  },
  normalizeSearchParams: (query: string | string[] | undefined) => {
    const value = Array.isArray(query) ? query[0] : query;

    return value?.trim() ?? '';
  },
  normalizeTagParams: (tag: string | string[] | undefined) => {
    const value = Array.isArray(tag) ? tag[0] : tag;

    return value?.trim().toLowerCase() ?? '';
  },
  isSupportedArticlesPageRequest: ({
    cursor,
    page,
  }: {
    cursor?: string | string[];
    page: number;
  }) => {
    if (page <= 1) return true;

    const value = Array.isArray(cursor) ? cursor[0] : cursor;
    const normalizedValue = value?.trim();

    return Boolean(normalizedValue);
  },
  ArticleTagPage: function ArticleTagPage() {
    return null;
  },
}));

describe('ArticleTagRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    vi.clearAllMocks();
  });

  it('태그 뷰 엔트리와 태그 목록 데이터를 반환한다', async () => {
    vi.mocked(getArticleTagPageData).mockResolvedValueOnce({
      activeTag: 'retrospect',
      feedLocale: 'en',
      initialCursor: null,
      initialItems: [],
      locale: 'en',
      pagination: {
        currentPage: 2,
        nextHref: '/en/articles/tag/retrospect?page=3',
        previousHref: '/en/articles/tag/retrospect',
      },
      searchQuery: 'three',
    });

    const element = await ArticleTagRoute({
      params: Promise.resolve({
        locale: 'en',
        tag: ' Retrospect ',
      }),
      searchParams: Promise.resolve({
        cursor: [' cursor-1 '],
        cursorHistory: [' cursor-root '],
        page: [' 2 '],
        q: [' three ', 'vue'],
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticleTagPage');
    expect(getArticleTagPageData).toHaveBeenCalledWith({
      cursor: [' cursor-1 '],
      cursorHistory: [' cursor-root '],
      locale: 'en',
      page: 2,
      query: [' three ', 'vue'],
      tag: 'retrospect',
    });
    expect(element.props.activeTag).toBe('retrospect');
    expect(element.props.activeTagLabel).toBe('Retrospect');
    expect(element.props.searchQuery).toBe('three');
  });

  it('태그 메타데이터에 canonical과 pagination을 포함한다', async () => {
    vi.mocked(getArticleTagPageData).mockResolvedValueOnce({
      activeTag: 'retrospect',
      feedLocale: 'en',
      initialCursor: 'cursor-2',
      initialItems: [],
      locale: 'en',
      pagination: {
        currentPage: 2,
        nextHref: '/en/articles/tag/retrospect?page=3',
        previousHref: '/en/articles/tag/retrospect',
      },
      searchQuery: 'three',
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          locale: 'en',
          tag: 'retrospect',
        }),
        searchParams: Promise.resolve({
          cursor: 'cursor-1',
          cursorHistory: 'cursor-root',
          page: '2',
          q: 'three',
        }),
      }),
    ).resolves.toMatchObject({
      alternates: {
        canonical: 'https://chaen.dev/en/articles/tag/retrospect',
      },
      description: 'Articles tagged with Retrospect',
      openGraph: {
        images: ['https://chaen.dev/thumbnail.png'],
        url: 'https://chaen.dev/en/articles/tag/retrospect',
      },
      pagination: {
        next: 'https://chaen.dev/en/articles/tag/retrospect?page=3',
        previous: 'https://chaen.dev/en/articles/tag/retrospect',
      },
      robots: {
        follow: true,
        index: false,
      },
      title: '#Retrospect | 2',
      twitter: {
        images: ['https://chaen.dev/thumbnail.png'],
      },
    });
  });

  it('정적 params는 공개 아티클에 연결된 태그 slug만 seed한다', async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { tag: 'retrospect' },
      { tag: 'react' },
    ]);
  });

  it('유효하지 않은 page searchParam이면 notFound를 호출한다', async () => {
    await expect(
      ArticleTagRoute({
        params: Promise.resolve({
          locale: 'en',
          tag: 'retrospect',
        }),
        searchParams: Promise.resolve({
          page: '0',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('존재하지 않는 태그 slug면 notFound를 호출한다', async () => {
    vi.mocked(getTagIdBySlug).mockResolvedValueOnce({
      data: null,
      schemaMissing: false,
    });

    await expect(
      ArticleTagRoute({
        params: Promise.resolve({
          locale: 'en',
          tag: 'missing-tag',
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
