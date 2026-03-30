/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';

import { AdminAnalyticsPage } from '@/views/admin-analytics/ui/admin-analytics-page';

import '@testing-library/jest-dom/vitest';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/widgets/admin-console', () => ({
  AdminConsoleShell: ({
    children,
    summary,
  }: {
    children: React.ReactNode;
    summary?: React.ReactNode;
  }) => (
    <div>
      {summary}
      {children}
    </div>
  ),
}));

describe('AdminAnalyticsPage', () => {
  it('Top 5 아티클과 PDF 로그를 함께 렌더링한다', () => {
    render(
      <AdminAnalyticsPage
        googleArticleTraffic={{
          items: [
            {
              clicks: 18,
              ctr: 0.36,
              impressions: 50,
              path: '/ko/articles/google-search-console',
              position: 2.8,
              url: 'https://chaen.dev/ko/articles/google-search-console',
            },
          ],
          status: 'configured',
          totalClicks: 18,
        }}
        locale="ko"
        pdfLogs={[
          {
            id: 'log-1',
            asset_key: 'resume-ko',
            kind: 'resume',
            file_locale: 'ko',
            source: 'resume-page',
            utm_source: 'linkedin',
            referer: 'https://chaen.dev',
            referer_path: '/ko/resume',
            device_type: 'desktop',
            country_code: 'KR',
            ip: null,
            created_at: '2026-03-30T10:00:00.000Z',
          },
        ]}
        topArticles={[
          {
            id: 'article-1',
            title: '글 1',
            slug: 'article-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
            view_count: 42,
          },
        ]}
      />,
    );

    expect(screen.getByText('Top 5 아티클')).toBeTruthy();
    expect(screen.getByText('글 1')).toBeTruthy();
    expect(screen.getByRole('link', { name: '글 1' })).toHaveAttribute(
      'href',
      '/articles/article-1',
    );
    expect(screen.getByText('PDF 로그')).toBeTruthy();
    expect(screen.getByText('resume-page')).toBeTruthy();
    expect(screen.getByText('Google 아티클 검색 유입')).toBeTruthy();
    expect(screen.getByText('/ko/articles/google-search-console')).toBeTruthy();
    expect(screen.getAllByText('18')).toHaveLength(2);
  });
});
