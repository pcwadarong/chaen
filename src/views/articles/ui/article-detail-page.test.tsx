// @vitest-environment node

import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

const authState = vi.hoisted<{
  isAdmin: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  userEmail: string | null;
  userId: string | null;
}>(() => ({
  isAdmin: false,
  isAuthenticated: false,
  isReady: true,
  userEmail: null,
  userId: null,
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (key === 'publishedAtLabel') return 'published';
    if (namespace === 'DetailUi' && key === 'backToList') return 'List';

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
  AdminDetailActionsGate: ({ editHref }: { editHref: string }) =>
    authState.isAdmin ? (
      <div data-testid="admin-detail-actions-gate">
        <a href={editHref}>수정</a>
        <span>삭제</span>
      </div>
    ) : null,
}));

vi.mock('@/shared/ui/markdown/markdown-renderer', () => ({
  MarkdownRenderer: ({ emptyText, markdown }: { emptyText?: string; markdown?: string | null }) => (
    <div>{markdown ?? emptyText ?? ''}</div>
  ),
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

/**
 * 서버 컴포넌트를 HTML 문자열로 변환합니다.
 */
const renderServerHtml = async () => {
  const { ArticleDetailPage } = await import('@/views/articles/ui/article-detail-page');
  const element = ArticleDetailPage({
    initialArchivePagePromise: Promise.resolve({
      items: [
        {
          id: 'article-1',
          slug: 'article-1-slug',
          title: 'Article 1',
          description: 'summary',
          publish_at: '2026-03-08T00:00:00.000Z',
        },
      ],
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
    authState.isAdmin = false;
    authState.isAuthenticated = false;
    authState.isReady = true;
    authState.userEmail = null;
    authState.userId = null;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.vercel.app';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('아티클 상세 하단에 댓글 섹션을 렌더링한다', async () => {
    const html = await renderServerHtml();

    expect(html).toContain('List');
    expect(html).toContain('href="/articles"');
    expect(html).toContain('href="/articles/tag/react"');
    expect(html).toContain('data-testid="article-comments-section"');
    expect(html).toContain('article-1');
    expect(html).toContain('2026-03-08');
    expect(html).toContain('published 2026-03-08');
    expect(html).toContain('#<!-- -->React');
    expect(html).toContain('relatedArticlesTitle');
    expect(html).toContain('Article 2');
    expect(html).not.toContain('/admin/articles/article-1/edit');
    expect(html).not.toContain('수정');
    expect(html).not.toContain('삭제');
  }, 30000);

  it('관리자 세션일 때만 수정과 삭제 액션을 노출한다', async () => {
    authState.isAdmin = true;
    authState.isAuthenticated = true;
    authState.userEmail = 'admin@example.com';
    authState.userId = 'admin-id';

    const html = await renderServerHtml();

    expect(html).toContain('/admin/articles/article-1/edit');
    expect(html).toContain('수정');
    expect(html).toContain('삭제');
  }, 30000);
});
