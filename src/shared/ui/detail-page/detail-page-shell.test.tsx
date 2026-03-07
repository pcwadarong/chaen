import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

describe('DetailPageShell', () => {
  it('hero 아래에 메타 바를 두고 그 다음에 본문을 렌더링한다', () => {
    render(
      <DetailPageShell
        content="상세 본문"
        emptyArchiveText="비어있음"
        heroDescription="설명"
        metaBar={<div data-testid="detail-meta-bar">메타 바</div>}
        sidebarItems={[]}
        sidebarLabel="아카이브"
        tagContent={<div>태그</div>}
        title="상세 제목"
      />,
    );

    const title = screen.getByRole('heading', { level: 1, name: '상세 제목' });
    const metaBar = screen.getByTestId('detail-meta-bar');
    const body = screen.getByText('상세 본문');

    expect(metaBar.closest('header')).toBeNull();
    expect(title.compareDocumentPosition(metaBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(metaBar.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('separator')).toBeNull();
  });
});
