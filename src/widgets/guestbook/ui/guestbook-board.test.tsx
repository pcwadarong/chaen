import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createGuestbookEntryClient } from '@/features/guestbook-feed/api/client';

import { GuestbookBoard } from './guestbook-board';

const hookState = {
  applyServerThread: vi.fn(),
  applyServerThreadEntry: vi.fn(),
  errorMessage: null as string | null,
  hasMore: false,
  isInitialLoading: false,
  isLoadingMore: false,
  items: [],
  loadMore: vi.fn(),
  prependLocalThread: vi.fn(),
  removeThreadById: vi.fn(),
  retryInitialLoad: vi.fn(),
  updateThreadById: vi.fn(),
};

const authState = {
  isAdmin: false,
};

const guestbookFeedProps = vi.fn();
const commentComposeFormProps = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/guestbook-feed/model/use-guestbook-feed', () => ({
  useGuestbookFeed: () => hookState,
}));

vi.mock('@/features/guestbook-feed/api/client', () => ({
  createGuestbookEntryClient: vi.fn(),
  deleteGuestbookEntryClient: vi.fn(),
  updateGuestbookEntryClient: vi.fn(),
  verifyGuestbookSecretClient: vi.fn(),
}));

vi.mock('@/features/guestbook-feed/ui/guestbook-feed', () => ({
  GuestbookFeed: (props: unknown) => {
    guestbookFeedProps(props);
    return <div data-testid="guestbook-feed" />;
  },
}));

vi.mock('@/shared/ui/comment-compose-form', () => ({
  CommentComposeForm: (props: { onSubmit: (values: unknown) => Promise<void> }) => {
    commentComposeFormProps(props);

    return (
      <button
        onClick={() =>
          void props.onSubmit({
            authorBlogUrl: '',
            authorName: 'tester',
            content: 'hello',
            isSecret: false,
            password: '1234',
          })
        }
        type="button"
      >
        submit-compose
      </button>
    );
  },
}));

vi.mock('@/shared/ui/modal/modal', () => ({
  Modal: () => null,
}));

vi.mock('@/shared/ui/toast/toast', () => ({
  ToastViewport: () => null,
}));

describe('GuestbookBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAdmin = false;
  });

  it('새 글 작성 요청이 실패하면 낙관적 스레드를 롤백한다', async () => {
    vi.mocked(createGuestbookEntryClient).mockRejectedValue(new Error('network error'));

    render(<GuestbookBoard />);
    fireEvent.click(screen.getByRole('button', { name: 'submit-compose' }));

    await waitFor(() => {
      expect(createGuestbookEntryClient).toHaveBeenCalledTimes(1);
      expect(hookState.prependLocalThread).toHaveBeenCalledTimes(1);
      expect(hookState.removeThreadById).toHaveBeenCalledTimes(1);
    });
  });

  it('일반 사용자면 답신 버튼과 관리자 전용 폼 구성을 숨긴다', () => {
    render(<GuestbookBoard />);

    expect(guestbookFeedProps).toHaveBeenCalledWith(
      expect.objectContaining({
        canReply: false,
      }),
    );
    expect(commentComposeFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSecretToggle: true,
        authorMode: 'manual',
        isReplyMode: false,
        replyTargetContent: null,
      }),
    );
  });

  it('관리자면 답신 가능 상태와 preset 작성 모드를 사용한다', () => {
    authState.isAdmin = true;

    render(<GuestbookBoard />);

    expect(guestbookFeedProps).toHaveBeenCalledWith(
      expect.objectContaining({
        canReply: true,
      }),
    );
    expect(commentComposeFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSecretToggle: false,
        authorMode: 'preset',
        presetAuthorName: 'admin',
      }),
    );
  });
});
