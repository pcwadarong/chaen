import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getResolvedArticle } from '@/entities/article/api/get-article';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { getArticleDetailPageData } from '@/views/articles';

import ArticleDetailRoute, { generateMetadata } from './page';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(async () => ({
    isAdmin: false,
    isAuthenticated: false,
    userEmail: null,
    userId: null,
  })),
}));

vi.mock('@/entities/article/api/get-article', () => ({
  getResolvedArticle: vi.fn(async () => ({
    item: null,
    resolvedLocale: null,
  })),
}));

vi.mock('@/views/articles', () => ({
  getArticleDetailPageData: vi.fn(async () => ({
    archivePage: {
      items: [],
      nextCursor: null,
    },
    initialCommentsPage: {
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    },
    item: null,
    relatedArticles: [],
  })),
  ArticleDetailPage: function ArticleDetailPage() {
    return null;
  },
}));

describe('ArticleDetailRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('아티클 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      initialCommentsPage: {
        items: [],
        page: 1,
        pageSize: 10,
        sort: 'latest',
        totalCount: 0,
        totalPages: 0,
      },
      relatedArticles: [],
      item: {
        id: 'frontend-performance',
        title: 'Frontend Performance',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['react'],
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: null,
      },
    });

    const element = await ArticleDetailRoute({
      params: Promise.resolve({
        id: 'frontend-performance',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticleDetailPage');
    expect(element.props.locale).toBe('ko');
    expect(element.props.isAdmin).toBe(false);
    expect(element.props.initialCommentsPage.pageSize).toBe(10);
    expect(getArticleDetailPageData).toHaveBeenCalledWith({
      articleId: 'frontend-performance',
      locale: 'ko',
    });
  });

  it('관리자면 상세 페이지에 수정 버튼 노출용 isAdmin을 전달한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      initialCommentsPage: {
        items: [],
        page: 1,
        pageSize: 10,
        sort: 'latest',
        totalCount: 0,
        totalPages: 0,
      },
      relatedArticles: [],
      item: {
        id: 'frontend-performance',
        title: 'Frontend Performance',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['react'],
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: null,
      },
    });
    vi.mocked(getServerAuthState).mockResolvedValueOnce({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const element = await ArticleDetailRoute({
      params: Promise.resolve({
        id: 'frontend-performance',
        locale: 'ko',
      }),
    });

    expect(element.props.isAdmin).toBe(true);
  });

  it('아티클 상세 메타데이터에 OG 이미지를 포함한다', async () => {
    vi.mocked(getResolvedArticle).mockResolvedValueOnce({
      item: {
        id: 'frontend-performance',
        title: 'Frontend Performance',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['react'],
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: null,
      },
      resolvedLocale: 'ko',
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          id: 'frontend-performance',
          locale: 'ko',
        }),
      }),
    ).resolves.toMatchObject({
      openGraph: {
        images: ['https://chaen.dev/api/og/article/frontend-performance'],
      },
      twitter: {
        images: ['https://chaen.dev/api/og/article/frontend-performance'],
      },
    });
  });

  it('데이터가 없으면 notFound를 호출한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      initialCommentsPage: {
        items: [],
        page: 1,
        pageSize: 10,
        sort: 'latest',
        totalCount: 0,
        totalPages: 0,
      },
      relatedArticles: [],
      item: null,
    });

    await expect(
      ArticleDetailRoute({
        params: Promise.resolve({
          id: 'missing-article',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(getArticleDetailPageData).toHaveBeenCalledWith({
      articleId: 'missing-article',
      locale: 'ko',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
