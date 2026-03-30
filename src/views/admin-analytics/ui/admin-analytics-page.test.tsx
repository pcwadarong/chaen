/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';

import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { PdfFileDownloadLog } from '@/entities/pdf-file/model/types';
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
  const googleArticleTraffic = {
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
    status: 'configured' as const,
    totalClicks: 18,
  };

  const pdfLogs: PdfFileDownloadLog[] = [
    {
      id: 'log-1',
      asset_key: 'resume-ko',
      kind: 'resume' as const,
      file_locale: 'ko' as const,
      source: 'resume-page',
      utm_source: 'linkedin',
      referer: 'https://chaen.dev',
      referer_path: '/ko/resume',
      device_type: 'desktop' as const,
      country_code: 'KR',
      ip: null,
      created_at: '2026-03-30T10:00:00.000Z',
    },
  ];

  const topArticles: AdminArticleListItem[] = [
    {
      id: 'article-1',
      title: '글 1',
      slug: 'article-1',
      visibility: 'public' as const,
      publish_at: '2026-03-20T09:00:00.000Z',
      thumbnail_url: null,
      created_at: '2026-03-18T09:00:00.000Z',
      updated_at: '2026-03-21T09:00:00.000Z',
      view_count: 42,
    },
  ];

  it('Google 유입이 연결된 상태일 때, 대시보드는 요약 지표와 각 패널의 핵심 데이터를 함께 렌더링해야 한다', () => {
    render(
      <AdminAnalyticsPage
        googleArticleTraffic={googleArticleTraffic}
        locale="ko"
        pdfLogs={pdfLogs}
        topArticles={topArticles}
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

  it('패널 닫기 토글이 실행되면, 해당 패널 본문은 숨겨져야 한다', () => {
    render(
      <AdminAnalyticsPage
        googleArticleTraffic={googleArticleTraffic}
        locale="ko"
        pdfLogs={pdfLogs}
        topArticles={topArticles}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '닫기' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: '닫기' })[1]);

    expect(screen.queryByRole('link', { name: '글 1' })).toBeNull();
    expect(screen.queryByText('2026-03-20')).toBeNull();
  });
});
