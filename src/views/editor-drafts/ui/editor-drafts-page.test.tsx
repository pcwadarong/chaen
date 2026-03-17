import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';

import { EditorDraftsPage } from '@/views/editor-drafts/ui/editor-drafts-page';

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
      expect(screen.getByText('임시저장을 삭제했습니다.')).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText('저장된 draft가 없습니다.')).toBeTruthy();
    });
  });

  it('삭제에 실패하면 토스트로 오류를 보여준다', async () => {
    const onDeleteDraft = vi
      .fn()
      .mockRejectedValue(
        new Error(
          '__EDITOR_ERROR__:draftDeleteFailed:임시저장을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
        ),
      );

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <EditorDraftsPage
        items={[
          {
            contentId: null,
            contentType: 'article',
            id: 'draft-1',
            title: '글 초안',
            updatedAt: '2026-03-13T09:00:00.000Z',
          },
        ]}
        onDeleteDraft={onDeleteDraft}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(
      await screen.findByText('임시저장을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeTruthy();
  });

  it('삭제 중 상태는 선택한 draft row에만 반영한다', async () => {
    let resolveDelete: ((value: void | PromiseLike<void>) => void) | undefined;
    const onDeleteDraft = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveDelete = resolve;
        }),
    );

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <EditorDraftsPage
        items={[
          {
            contentId: null,
            contentType: 'article',
            id: 'draft-1',
            title: '글 초안 1',
            updatedAt: '2026-03-13T09:00:00.000Z',
          },
          {
            contentId: null,
            contentType: 'project',
            id: 'draft-2',
            title: '글 초안 2',
            updatedAt: '2026-03-13T09:30:00.000Z',
          },
        ]}
        onDeleteDraft={onDeleteDraft}
      />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '삭제 중...' })).toBeTruthy();
    });
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(1);

    if (resolveDelete) {
      resolveDelete(undefined);
    }

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '삭제 중...' })).toBeNull();
    });
  });
});
