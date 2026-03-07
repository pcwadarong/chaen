import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleDetailPageClient } from './article-detail-page.client';

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

describe('ArticleDetailPageClient', () => {
  it('태그를 버튼으로 렌더링하고 대표 이미지 섹션 없이 본문만 보여준다', () => {
    render(
      <ArticleDetailPageClient
        archiveItems={[
          {
            id: 'frontend',
            title: 'Frontend',
            description: 'desc',
            created_at: '2026-03-02T00:00:00.000Z',
          },
        ]}
        content="아티클 본문"
        description="요약"
        emptyArchiveText="비어있음"
        emptyContentText="본문 없음"
        emptySummaryText="요약 없음"
        id="frontend"
        locale="ko"
        noTagsText="태그없음"
        publishedText="등록일 2026-03-02"
        sectionLabels={{
          archive: '기록 아카이브',
          tagList: '태그',
        }}
        shareLabels={{
          copyFailed: '실패',
          copied: '복사됨',
          share: '공유하기',
          viewCount: '조회수',
        }}
        tagLabels={['React']}
        title="Frontend"
        viewCount={0}
      />,
    );

    expect(screen.getByRole('button', { name: '#React' })).toBeTruthy();
    expect(screen.getByText('아티클 본문')).toBeTruthy();
    expect(screen.queryByText(/수정일/)).toBeNull();
    expect(screen.queryByText(/대표 이미지/)).toBeNull();
  });
});
