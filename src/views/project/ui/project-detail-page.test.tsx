import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

import type { Project } from '@/entities/project/model/types';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === 'ProjectDetail') {
      if (key === 'periodLabel') return 'work period';
      if (key === 'ongoing') return 'Ongoing';
    }

    if (namespace === 'TechStack.category') {
      if (key === 'frontend') return 'Frontend';
      if (key === 'backend') return 'Backend';
      if (key === 'infra') return 'Infrastructure';
      if (key === 'collaboration') return 'Collaboration';
    }

    return key;
  },
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
const renderServerHtml = async ({
  item,
  locale = 'en',
}: {
  item?: Project;
  locale?: 'en' | 'ko';
} = {}) => {
  const { ProjectDetailPage } = await import('@/views/project/ui/project-detail-page');
  const element = ProjectDetailPage({
    initialArchivePage: {
      items: [
        {
          id: 'project-1',
          slug: 'project-1-slug',
          title: 'Project 1',
          description: 'summary',
          publish_at: '2026-03-08T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    },
    item: item ?? {
      id: 'project-1',
      slug: 'project-1-slug',
      title: 'Project 1',
      description: 'summary',
      content: '# hello',
      created_at: '2026-03-08T00:00:00.000Z',
      publish_at: '2026-03-08T00:00:00.000Z',
      period_start: '2026-01-01',
      period_end: '2026-02-01',
      tags: ['react'],
      github_url: 'https://github.com/example/project-1',
      thumbnail_url: null,
      website_url: 'https://project-1.example.com',
    },
    locale,
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
    expect(html).toContain('https://chaen.vercel.app/en/project/project-1-slug');
    expect(html).toContain('January 2026 - February 2026');
    expect(html).toContain('work period January 2026 - February 2026');
    expect(html).toContain('/admin/projects/project-1/edit');
    expect(html).toContain('수정');
    expect(html).toContain('삭제');
    expect(html).toContain('Website');
    expect(html).toContain('GitHub');
    expect(html).toContain('https://project-1.example.com');
    expect(html).toContain('https://github.com/example/project-1');
  }, 30000);

  it('기술 스택 카테고리 라벨은 locale 번역을 사용한다', async () => {
    const html = await renderServerHtml({
      item: {
        id: 'project-1',
        slug: 'project-1-slug',
        title: 'Project 1',
        description: 'summary',
        content: '# hello',
        created_at: '2026-03-08T00:00:00.000Z',
        publish_at: '2026-03-08T00:00:00.000Z',
        period_start: '2026-01-01',
        period_end: '2026-02-01',
        tech_stacks: [{ category: 'frontend', id: 'react', name: 'React', slug: 'react' }],
        thumbnail_url: null,
      },
    });

    expect(html).toContain('Frontend');
    expect(html).toContain('React');
  });
});
