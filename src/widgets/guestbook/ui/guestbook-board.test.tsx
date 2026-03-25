import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { GuestbookBoard } from '@/widgets/guestbook/ui/guestbook-board';

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
const useBrowseGuestbookSpy = vi.fn();
useBrowseGuestbookSpy.mockReturnValue(hookState);

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/guestbook-entry/model/use-browse-guestbook', () => ({
  useBrowseGuestbook: (input: unknown) => useBrowseGuestbookSpy(input),
}));

vi.mock('@/features/guestbook-entry/api/submit-guestbook-entry', () => ({
  submitGuestbookEntry: vi.fn(),
}));

vi.mock('@/features/guestbook-entry/model/guestbook-entry-action-state', () => ({
  initialSubmitGuestbookEntryState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
}));

vi.mock('@/widgets/guestbook/ui/guestbook-feed', () => ({
  GuestbookFeed: (props: unknown) => {
    guestbookFeedProps(props);
    return <div data-testid="guestbook-feed" />;
  },
}));

vi.mock('@/shared/ui/comment-compose', () => ({
  CommentComposeForm: (props: unknown) => {
    commentComposeFormProps(props);
    const [value, setValue] = React.useState('');

    return (
      <div data-testid="comment-compose-form">
        <input
          aria-label="guestbook-compose-input"
          onChange={event => setValue(event.target.value)}
          value={value}
        />
      </div>
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
    useBrowseGuestbookSpy.mockReturnValue(hookState);
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
    expect(useBrowseGuestbookSpy).toHaveBeenCalledWith(
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

  it('작성 폼 입력 중에는 feed를 다시 그리지 않는다', async () => {
    render(<GuestbookBoard />);

    await waitFor(() => {
      expect(screen.getByLabelText('guestbook-compose-input')).toBeTruthy();
    });

    expect(guestbookFeedProps).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('guestbook-compose-input'), {
      target: { value: 'hello guestbook' },
    });

    expect(guestbookFeedProps).toHaveBeenCalledTimes(1);
  });
});
