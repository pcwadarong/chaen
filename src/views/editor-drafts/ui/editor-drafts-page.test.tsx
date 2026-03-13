import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('삭제를 확인하면 server action을 호출하고 현재 목록에서 제거한다', async () => {
    const onDeleteDraft = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(window, 'confirm').mockReturnValue(true);

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
        onDeleteDraft={onDeleteDraft}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(onDeleteDraft).toHaveBeenCalledWith('resume-draft-1', 'resume');
    });
    await waitFor(() => {
      expect(screen.getByText('저장된 draft가 없습니다.')).toBeTruthy();
    });
  });
});
