/* @vitest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ArticleDetailMetaBar } from '@/features/track-article-view/ui/article-detail-meta-bar';

const authState = vi.hoisted(() => ({
  isAdmin: false,
  isAuthenticated: false,
  userEmail: null,
  userId: null,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

describe('ArticleDetailMetaBar', () => {
  const trackViewActionMock = vi.fn();

  beforeEach(() => {
    authState.isAdmin = false;
    trackViewActionMock.mockReset();
  });

  it('관리자가 아닐 때는 조회수 증가 요청을 전달해야 한다', async () => {
    trackViewActionMock.mockResolvedValue({
      data: {
        viewCount: 9,
      },
      errorMessage: null,
      ok: true,
    });

    render(
      <ArticleDetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026-03-08"
        shareText="공유"
        trackViewAction={trackViewActionMock}
        trackViewStorageKey="article:test"
        viewCount={0}
        viewCountLabel="조회수"
      />,
    );

    await waitFor(() => {
      expect(trackViewActionMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('관리자일 때는 조회수 증가 요청을 보내지 않아야 한다', async () => {
    authState.isAdmin = true;

    render(
      <ArticleDetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026-03-08"
        shareText="공유"
        trackViewAction={trackViewActionMock}
        trackViewStorageKey="article:test"
        viewCount={7}
        viewCountLabel="조회수"
      />,
    );

    await waitFor(() => {
      expect(trackViewActionMock).not.toHaveBeenCalled();
    });
    expect(screen.getByText('7')).toBeTruthy();
  });
});
