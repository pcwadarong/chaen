import { act, renderHook } from '@testing-library/react';

import { createGuestbookEntryClient } from '@/features/guestbook-feed/api/client';

import { useGuestbookComposeActions } from './use-guestbook-compose-actions';

vi.mock('@/features/guestbook-feed/api/client', () => ({
  createGuestbookEntryClient: vi.fn(),
  verifyGuestbookSecretClient: vi.fn(),
}));

describe('useGuestbookComposeActions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('비밀 원댓글 작성 시 optimistic thread를 masked 상태로 추가한다', async () => {
    const prependLocalThread = vi.fn();
    const removeThreadById = vi.fn();

    vi.mocked(createGuestbookEntryClient).mockResolvedValue({
      author_blog_url: null,
      author_name: 'guest',
      content: '',
      created_at: '2026-03-08T00:00:00.000Z',
      deleted_at: null,
      id: 'server-thread-1',
      is_admin_author: false,
      is_content_masked: true,
      is_secret: true,
      parent_id: null,
      updated_at: '2026-03-08T00:00:00.000Z',
    });

    const { result } = renderHook(() =>
      useGuestbookComposeActions({
        feedMutations: {
          applyServerThreadEntry: vi.fn(),
          prependLocalThread,
          removeThreadById,
          updateThreadById: vi.fn(),
        },
        isAdmin: false,
        pushToast: vi.fn(),
        replyTarget: null,
        setReplyTarget: vi.fn(),
        text: {
          toastCreateError: '생성 실패',
          toastCreateSuccess: '생성 성공',
          toastReplyError: '답글 실패',
          toastReplySuccess: '답글 성공',
          toastSecretVerifyError: '검증 실패',
        },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit({
        authorBlogUrl: '',
        authorName: 'guest',
        content: 'secret body',
        isSecret: true,
        password: '1234',
      });
    });

    expect(prependLocalThread).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '',
        is_content_masked: true,
        is_secret: true,
      }),
    );
    expect(removeThreadById).toHaveBeenCalledTimes(1);
  });
});
