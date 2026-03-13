import { render, screen } from '@testing-library/react';
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';

import '@testing-library/jest-dom/vitest';

import { EditorDraftsPage } from './editor-drafts-page';

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

describe('EditorDraftsPage', () => {
  it('resume draft 이어쓰기 링크를 resume 전용 편집 화면으로 연결한다', () => {
    render(
      <EditorDraftsPage
        items={[
          {
            contentId: null,
            contentType: 'resume',
            id: 'resume-draft-1',
            title: '이력서 초안',
            updatedAt: '2026-03-13T09:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: '이어쓰기' })).toHaveAttribute(
      'href',
      '/admin/resume/edit?draftId=resume-draft-1',
    );
  });
});
