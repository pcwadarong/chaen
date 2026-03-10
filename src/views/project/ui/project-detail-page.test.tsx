import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === 'periodLabel') return 'work period';
    if (key === 'ongoing') return 'Ongoing';

    return key;
  }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

/**
 * 서버 컴포넌트를 HTML 문자열로 변환합니다.
 */
const renderServerHtml = async () => {
  const { ProjectDetailPage } = await import('@/views/project/ui/project-detail-page');
  const element = await ProjectDetailPage({
    archivePage: {
      items: [],
      nextCursor: null,
    },
    item: {
      id: 'project-1',
      title: 'Project 1',
      description: 'summary',
      content: '# hello',
      created_at: '2026-03-08T00:00:00.000Z',
      period_start: '2026-01-01',
      period_end: '2026-02-01',
      tags: ['react'],
      thumbnail_url: null,
    },
    locale: 'en',
  });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

describe('ProjectDetailPage', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.vercel.app/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('프로젝트 메타 바는 기간만 표시하고 스크린리더 라벨은 유지한다', async () => {
    const html = await renderServerHtml();

    expect(html).toContain('"@type":"CreativeWork"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('https://chaen.dev/en/project/project-1');
    expect(html).toContain('January 2026 - February 2026');
    expect(html).toContain('work period January 2026 - February 2026');
  }, 30000);
});
