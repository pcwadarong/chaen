import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

import type { ArticleCommentPage } from '@/entities/article-comment/model/types';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === 'publishedAtLabel') return 'published';

    return key;
  }),
}));

vi.mock('@/widgets/article-comments', () => ({
  ArticleCommentsSection: ({ articleId }: { articleId: string }) => (
    <section data-testid="article-comments-section">{articleId}</section>
  ),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

const initialCommentsPage: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
};

/**
 * 서버 컴포넌트를 HTML 문자열로 변환합니다.
 */
const renderServerHtml = async () => {
  const { ArticleDetailPage } = await import('@/views/articles/ui/article-detail-page');
  const element = await ArticleDetailPage({
    archiveItems: [],
    initialCommentsPage,
    item: {
      id: 'article-1',
      title: 'Article 1',
      description: 'summary',
      content: '# hello',
      created_at: '2026-03-08T00:00:00.000Z',
      tags: ['react'],
      thumbnail_url: null,
      updated_at: null,
      view_count: 12,
    },
    locale: 'ko',
  });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

describe('ArticleDetailPage', () => {
  it('아티클 상세 하단에 댓글 섹션을 렌더링한다', async () => {
    const html = await renderServerHtml();

    expect(html).toContain('data-testid="article-comments-section"');
    expect(html).toContain('article-1');
    expect(html).toContain('2026-03-08');
    expect(html).toContain('published 2026-03-08');
  }, 30000);
});
