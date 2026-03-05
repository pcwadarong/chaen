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

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => ({
    isAdmin: false,
  }),
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
  GuestbookFeed: () => <div data-testid="guestbook-feed" />,
}));

vi.mock('@/features/guestbook-compose/ui/guestbook-compose-form', () => ({
  GuestbookComposeForm: ({ onSubmit }: { onSubmit: (values: unknown) => Promise<void> }) => (
    <button
      onClick={() =>
        void onSubmit({
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
  ),
}));

vi.mock('@/shared/ui/modal/modal', () => ({
  Modal: () => null,
}));

vi.mock('@/shared/ui/toast', () => ({
  ToastViewport: () => null,
}));

describe('GuestbookBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
