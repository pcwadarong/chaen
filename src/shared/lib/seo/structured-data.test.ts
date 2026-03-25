// @vitest-environment node

import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildProjectJsonLd,
} from '@/shared/lib/seo/structured-data';

describe('structured-data helpers', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.vercel.app';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('breadcrumb json-ld는 절대 경로와 순서를 만든다', () => {
    expect(
      buildBreadcrumbJsonLd([
        { name: '홈', path: '/ko' },
        { name: '아티클', path: '/ko/articles' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          item: 'https://chaen.vercel.app/ko',
          name: '홈',
          position: 1,
        },
        {
          '@type': 'ListItem',
          item: 'https://chaen.vercel.app/ko/articles',
          name: '아티클',
          position: 2,
        },
      ],
    });
  });

  it('article json-ld는 BlogPosting 메타데이터를 만든다', () => {
    expect(
      buildArticleJsonLd({
        createdAt: '2026-03-08T00:00:00.000Z',
        description: 'summary',
        locale: 'ko',
        path: '/ko/articles/article-1-slug',
        tags: ['react'],
        thumbnailUrl: null,
        title: 'Article 1',
        updatedAt: null,
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      dateModified: '2026-03-08T00:00:00.000Z',
      datePublished: '2026-03-08T00:00:00.000Z',
      description: 'summary',
      headline: 'Article 1',
      image: undefined,
      inLanguage: 'ko',
      keywords: 'react',
      mainEntityOfPage: 'https://chaen.vercel.app/ko/articles/article-1-slug',
      url: 'https://chaen.vercel.app/ko/articles/article-1-slug',
    });
  });

  it('project json-ld는 CreativeWork 메타데이터를 만든다', () => {
    expect(
      buildProjectJsonLd({
        createdAt: '2026-03-08T00:00:00.000Z',
        description: 'summary',
        locale: 'en',
        path: '/en/project/project-1-slug',
        tags: ['react', 'nextjs'],
        thumbnailUrl: null,
        title: 'Project 1',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      dateCreated: '2026-03-08T00:00:00.000Z',
      description: 'summary',
      image: undefined,
      inLanguage: 'en',
      keywords: 'react, nextjs',
      name: 'Project 1',
      url: 'https://chaen.vercel.app/en/project/project-1-slug',
    });
  });
});
