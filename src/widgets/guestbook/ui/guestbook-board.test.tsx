import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

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
const useGuestbookFeedSpy = vi.fn();
useGuestbookFeedSpy.mockReturnValue(hookState);

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/guestbook-feed/model/use-guestbook-feed', () => ({
  useGuestbookFeed: (input: unknown) => useGuestbookFeedSpy(input),
}));

vi.mock('@/features/guestbook-feed/api/guestbook-actions', () => ({
  initialSubmitGuestbookEntryState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
  submitGuestbookEntry: vi.fn(),
}));

vi.mock('@/features/guestbook-feed/ui/guestbook-feed', () => ({
  GuestbookFeed: (props: unknown) => {
    guestbookFeedProps(props);
    return <div data-testid="guestbook-feed" />;
  },
}));

vi.mock('@/shared/ui/comment-compose-form', () => ({
  CommentComposeForm: (props: unknown) => {
    commentComposeFormProps(props);

    return <div data-testid="comment-compose-form" />;
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

  it('작성 폼에 Server Action과 submission 상태를 연결한다', async () => {
    render(<GuestbookBoard />);

    await waitFor(() => {
      expect(screen.getByTestId('comment-compose-form')).toBeTruthy();
    });

    expect(commentComposeFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        formAction: expect.any(Function),
        hiddenFields: {
          locale: 'ko',
          parentId: null,
        },
        submissionResult: {
          data: null,
          errorMessage: null,
          ok: false,
        },
      }),
    );
    expect(useGuestbookFeedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        initialCursor: null,
        initialItems: [],
        locale: 'ko',
      }),
    );
  });

  it('일반 사용자면 답신 버튼과 관리자 전용 폼 구성을 숨긴다', () => {
    render(<GuestbookBoard />);

    expect(guestbookFeedProps).toHaveBeenCalledWith(
      expect.objectContaining({
        canReply: false,
        onRevealSecretSuccess: expect.any(Function),
      }),
    );
    expect(commentComposeFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSecretToggle: true,
        authorMode: 'manual',
        hiddenFields: {
          locale: 'ko',
          parentId: null,
        },
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
        hiddenFields: {
          locale: 'ko',
          parentId: null,
        },
        presetAuthorName: 'admin',
      }),
    );
  });
});
