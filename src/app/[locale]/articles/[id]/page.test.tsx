import { isValidElement } from 'react';
import { vi } from 'vitest';

import ArticleDetailRoute, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/articles/[id]/page';
import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleStaticParams } from '@/entities/article/api/detail/get-article-static-params';
import { getArticleDetailPageData } from '@/views/articles';

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

vi.mock('@/entities/article/api/detail/get-article', () => ({
  getResolvedArticle: vi.fn(async () => ({
    item: null,
    resolvedLocale: null,
  })),
}));

vi.mock('@/entities/article/api/detail/get-article-static-params', () => ({
  getArticleStaticParams: vi.fn(async () => []),
}));

vi.mock('@/views/articles', () => ({
  getArticleDetailPageData: vi.fn(async () => ({
    archivePage: {
      items: [],
      nextCursor: null,
    },
    item: null,
    relatedArticles: [],
    tagLabels: [],
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

  it('공개 아티클 slug를 정적 params로 반환한다', async () => {
    vi.mocked(getArticleStaticParams).mockResolvedValueOnce([{ id: 'article-1' }]);

    await expect(generateStaticParams()).resolves.toEqual([{ id: 'article-1' }]);
  });

  it('아티클 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      relatedArticles: [],
      tagLabels: ['React'],
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
    expect(getArticleDetailPageData).toHaveBeenCalledWith({
      articleSlug: 'frontend-performance',
      locale: 'ko',
    });
  });

  it('아티클 상세 메타데이터에 OG 이미지를 포함한다', async () => {
    vi.mocked(getResolvedArticle).mockResolvedValueOnce({
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
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      relatedArticles: [],
      tagLabels: [],
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
      articleSlug: 'missing-article',
      locale: 'ko',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
