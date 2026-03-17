import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    if (key === 'publishedAtLabel') return 'published';

    return key;
  },
}));

vi.mock('@/widgets/article-comments', () => ({
  ArticleCommentsSection: ({ articleId }: { articleId: string }) => (
    <section data-testid="article-comments-section">{articleId}</section>
  ),
}));

vi.mock('@/entities/article/ui/article-list-item', () => ({
  ArticleListItem: ({ article }: { article: { slug?: string | null; title: string } }) => (
    <a href={`/articles/${article.slug}`}>{article.title}</a>
  ),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/widgets/detail-page/ui/admin-detail-actions-gate', () => ({
  AdminDetailActionsGate: ({ editHref }: { editHref: string }) => (
    <div data-testid="admin-detail-actions-gate">
      <a href={editHref}>수정</a>
      <span>삭제</span>
    </div>
  ),
}));

/**
 * 서버 컴포넌트를 HTML 문자열로 변환합니다.
 */
const renderServerHtml = async () => {
  const { ArticleDetailPage } = await import('@/views/articles/ui/article-detail-page');
  const element = ArticleDetailPage({
    archivePagePromise: Promise.resolve({
      items: [],
      nextCursor: null,
    }),
    item: {
      id: 'article-1',
      slug: 'article-1-slug',
      title: 'Article 1',
      description: 'summary',
      content: '# hello',
      created_at: '2026-03-08T00:00:00.000Z',
      publish_at: '2026-03-08T00:00:00.000Z',
      tags: ['react'],
      thumbnail_url: null,
      updated_at: null,
      view_count: 12,
    },
    locale: 'ko',
    relatedArticlesPromise: Promise.resolve([
      {
        id: 'article-2',
        slug: 'article-2-slug',
        title: 'Article 2',
        description: 'related summary',
        thumbnail_url: null,
        publish_at: '2026-03-07T00:00:00.000Z',
      },
    ]),
    tagLabelsPromise: Promise.resolve(['React']),
  });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

describe('ArticleDetailPage', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.vercel.app';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('아티클 상세 하단에 댓글 섹션을 렌더링한다', async () => {
    const html = await renderServerHtml();
    const textContent = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';

    expect(html).toContain('data-testid="article-comments-section"');
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('https://chaen.vercel.app/ko/articles/article-1-slug');
    expect(html).toContain('article-1');
    expect(html).toContain('2026-03-08');
    expect(html).toContain('published 2026-03-08');
    expect(textContent).toContain('#React');
    expect(textContent).toContain('relatedArticlesTitle');
    expect(textContent).toContain('Article 2');
    expect(html).toContain('/admin/articles/article-1/edit');
    expect(textContent).toContain('수정');
    expect(textContent).toContain('삭제');
  }, 30000);

  it('전달받은 태그 라벨로 상세 페이지를 렌더링한다', async () => {
    const html = await renderServerHtml();
    const textContent = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';

    expect(textContent).toContain('#React');
  });
});
