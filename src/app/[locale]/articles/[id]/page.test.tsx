import { isValidElement } from 'react';
import { vi } from 'vitest';

import ArticleDetailRoute, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/articles/[id]/page';
import { getArticleStaticSeedParams } from '@/entities/article/api/detail/get-article-static-seed-params';
import {
  getArticleDetailArchivePageData,
  getArticleDetailRelatedArticlesData,
  getArticleDetailShellData,
  getArticleTagLabels,
} from '@/views/articles';

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

vi.mock('@/entities/article/api/detail/get-article-static-seed-params', () => ({
  getArticleStaticSeedParams: vi.fn(async () => []),
}));

vi.mock('@/views/articles', () => ({
  getArticleDetailShellData: vi.fn(async () => ({
    availableLocales: [],
    item: null,
    resolvedLocale: null,
  })),
  getArticleDetailArchivePageData: vi.fn(async () => ({
    items: [],
    nextCursor: null,
  })),
  getArticleDetailRelatedArticlesData: vi.fn(async () => []),
  getArticleTagLabels: vi.fn(async () => []),
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

  it('상세 slug는 대표 경로만 seed한다', async () => {
    vi.mocked(getArticleStaticSeedParams).mockResolvedValueOnce([{ id: 'seed-article' }]);

    await expect(generateStaticParams()).resolves.toEqual([{ id: 'seed-article' }]);
  });

  it('아티클 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getArticleDetailShellData).mockResolvedValueOnce({
      availableLocales: ['ko'],
      item: {
        id: 'frontend-performance',
        slug: 'frontend-performance-slug',
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
    vi.mocked(getArticleDetailRelatedArticlesData).mockResolvedValueOnce([]);
    vi.mocked(getArticleDetailArchivePageData).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });
    vi.mocked(getArticleTagLabels).mockResolvedValueOnce(['React']);

    const element = await ArticleDetailRoute({
      params: Promise.resolve({
        id: 'frontend-performance',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticleDetailPage');
    expect(element.props.locale).toBe('ko');
    expect(getArticleDetailShellData).toHaveBeenCalledWith({
      articleSlug: 'frontend-performance',
      locale: 'ko',
    });
    expect(getArticleDetailArchivePageData).toHaveBeenCalledWith({
      item: expect.objectContaining({
        id: 'frontend-performance',
      }),
      locale: 'ko',
    });
    expect(element.props.initialArchivePage).toEqual({
      items: [],
      nextCursor: null,
    });
    await expect(element.props.relatedArticlesPromise).resolves.toEqual([]);
    await expect(element.props.tagLabelsPromise).resolves.toEqual(['React']);
  });

  it('아티클 상세 메타데이터에 OG 이미지를 포함한다', async () => {
    vi.mocked(getArticleDetailShellData).mockResolvedValueOnce({
      availableLocales: ['ko'],
      item: {
        id: 'frontend-performance',
        slug: 'frontend-performance-slug',
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
        images: ['https://chaen.dev/api/og/article/frontend-performance-slug'],
      },
      twitter: {
        images: ['https://chaen.dev/api/og/article/frontend-performance-slug'],
      },
    });
  });

  it('데이터가 없으면 notFound를 호출한다', async () => {
    vi.mocked(getArticleDetailShellData).mockResolvedValueOnce({
      availableLocales: [],
      item: null,
      resolvedLocale: null,
    });

    await expect(
      ArticleDetailRoute({
        params: Promise.resolve({
          id: 'missing-article',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(getArticleDetailShellData).toHaveBeenCalledWith({
      articleSlug: 'missing-article',
      locale: 'ko',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
