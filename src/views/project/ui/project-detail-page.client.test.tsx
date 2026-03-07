import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ProjectDetailPageClient } from './project-detail-page.client';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/shared/ui/detail-page/detail-meta-bar', () => ({
  DetailMetaBar: () => <div data-testid="detail-meta-bar" />,
}));

describe('ProjectDetailPageClient', () => {
  it('등록일 대신 기간 메타와 본문만 렌더링한다', () => {
    render(
      <ProjectDetailPageClient
        archiveItems={[
          {
            id: 'funda',
            title: 'FUNDA',
            description: 'desc',
            created_at: '2026-03-02T00:00:00.000Z',
          },
        ]}
        content="프로젝트 설명"
        description="요약"
        emptyArchiveText="비어있음"
        emptyDescriptionText="본문 없음"
        emptySummaryText="요약 없음"
        id="funda"
        locale="ko"
        noTagsText="태그없음"
        periodText="2026년 1월 - 2026년 2월"
        sectionLabels={{
          archive: '프로젝트 아카이브',
          tagList: '태그',
        }}
        shareLabels={{
          copyFailed: '실패',
          copied: '복사됨',
          share: '공유하기',
        }}
        tagLabels={['Next.js', 'CS']}
        title="FUNDA"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'FUNDA' })).toBeTruthy();
    expect(screen.getByText('프로젝트 설명')).toBeTruthy();
    expect(screen.getByTestId('detail-meta-bar')).toBeTruthy();
    expect(screen.queryByText(/등록일/)).toBeNull();
  });
});
