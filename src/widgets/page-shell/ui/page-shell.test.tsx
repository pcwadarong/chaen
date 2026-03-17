import { render, screen } from '@testing-library/react';
import React from 'react';

import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

describe('PageShell', () => {
  it('헤더 제목과 액션을 같은 영역에 렌더링한다', () => {
    render(
      <PageShell>
        <PageHeader action={<button type="button">다운로드</button>} title="프로젝트 아카이브" />
      </PageShell>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '프로젝트 아카이브' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '다운로드' })).toBeTruthy();
  });

  it('섹션 제목이 있으면 대응하는 h2를 렌더링한다', () => {
    render(
      <PageShell>
        <PageSection title="본문" titleId="page-section-content">
          <p>content</p>
        </PageSection>
      </PageShell>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '본문' })).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });
});
