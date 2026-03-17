import { act, renderHook } from '@testing-library/react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { deleteGuestbookEntryAction } from '@/features/manage-guestbook-entry/api/delete-guestbook-entry';
import { updateGuestbookEntryAction } from '@/features/manage-guestbook-entry/api/update-guestbook-entry';
import { useManageGuestbookEntryModal } from '@/features/manage-guestbook-entry/model/use-manage-guestbook-entry-modal';

vi.mock('@/features/manage-guestbook-entry/api/delete-guestbook-entry', () => ({
  deleteGuestbookEntryAction: vi.fn(),
}));

vi.mock('@/features/manage-guestbook-entry/api/update-guestbook-entry', () => ({
  updateGuestbookEntryAction: vi.fn(),
}));

const modalText = {
  deleteModalTitle: '삭제',
  editContentUnchanged: '변경 없음',
  editModalTitle: '수정',
  requiredField: '필수',
  secretVerifyFailed: '비밀번호 오류',
  toastDeleteError: '삭제 실패',
  toastDeleteSuccess: '삭제 성공',
  toastEditError: '수정 실패',
  toastEditSuccess: '수정 성공',
  toastSecretUnlockRequired: '잠금 해제 필요',
};

/**
 * 테스트용 대댓글 fixture를 생성합니다.
 */
const createReplyFixture = (id: string, content = `reply-${id}`): GuestbookEntry => ({
  author_blog_url: null,
  author_name: `reply-author-${id}`,
  content,
  created_at: '2026-03-10T00:00:00.000Z',
  deleted_at: null,
  id,
  is_admin_author: false,
  is_secret: false,
  parent_id: 'thread-1',
  updated_at: '2026-03-10T00:00:00.000Z',
});

/**
 * 테스트용 스레드 fixture를 생성합니다.
 */
const createThreadFixture = (
  id: string,
  overrides?: Partial<GuestbookThreadItem>,
): GuestbookThreadItem => ({
  author_blog_url: null,
  author_name: `thread-author-${id}`,
  content: `thread-${id}`,
  created_at: '2026-03-10T00:00:00.000Z',
  deleted_at: null,
  id,
  is_admin_author: false,
  is_secret: false,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-10T00:00:00.000Z',
  ...overrides,
});

/**
 * hook 테스트에서 사용하는 상태 변경 콜백과 현재 목록 접근기를 생성합니다.
 */
const renderActionModalHook = (initialItems: GuestbookThreadItem[]) => {
  let currentItems = initialItems;
  const pushToast = vi.fn();

  const applyServerThread = (entry: GuestbookThreadItem) => {
    const targetIndex = currentItems.findIndex(item => item.id === entry.id);

    if (targetIndex < 0) {
      currentItems = [...currentItems, entry];
      return;
    }

    currentItems = currentItems.map(item => (item.id === entry.id ? entry : item));
  };

  const applyServerThreadEntry = (entry: GuestbookThreadItem | GuestbookEntry) => {
    if ('replies' in entry) {
      applyServerThread(entry);
      return;
    }

    currentItems = currentItems.map(item =>
      item.id === entry.parent_id
        ? {
            ...item,
            replies: item.replies.map(reply => (reply.id === entry.id ? entry : reply)),
          }
        : item,
    );
  };

  const removeThreadById = (id: string) => {
    currentItems = currentItems.filter(item => item.id !== id);
  };

  const updateThreadById = (
    id: string,
    updater: (entry: GuestbookThreadItem) => GuestbookThreadItem,
  ) => {
    currentItems = currentItems.map(item => (item.id === id ? updater(item) : item));
  };

  const hook = renderHook(() =>
    useManageGuestbookEntryModal({
      applyServerThread,
      applyServerThreadEntry,
      isAdmin: true,
      items: currentItems,
      locale: 'ko',
      pushToast,
      removeThreadById,
      text: modalText,
      updateThreadById,
    }),
  );

  return {
    getItems: () => currentItems,
    pushToast,
    ...hook,
  };
};

describe('useManageGuestbookEntryModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('수정 action이 ok=false를 반환하면 optimistic update를 되돌린다', async () => {
    const thread = createThreadFixture('thread-1', { content: '원래 본문' });
    vi.mocked(updateGuestbookEntryAction).mockResolvedValue({
      data: null,
      errorCode: null,
      errorMessage: 'failed',
      ok: false,
    });

    const { getItems, pushToast, result } = renderActionModalHook([thread]);

    act(() => {
      result.current.openEditModal(thread);
      result.current.setModalContent('수정된 본문');
    });

    await act(async () => {
      await result.current.handleConfirmModal();
    });

    expect(getItems()[0]?.content).toBe('원래 본문');
    expect(pushToast).toHaveBeenCalledWith('수정 실패', 'error');
  });

  it('대댓글 삭제 action이 ok=false를 반환하면 optimistic removal을 되돌린다', async () => {
    const reply = createReplyFixture('reply-1', '대댓글 본문');
    const thread = createThreadFixture('thread-1', { replies: [reply] });
    vi.mocked(deleteGuestbookEntryAction).mockResolvedValue({
      data: null,
      errorCode: null,
      errorMessage: 'failed',
      ok: false,
    });

    const { getItems, pushToast, result } = renderActionModalHook([thread]);

    act(() => {
      result.current.openDeleteReplyModal(reply, thread);
    });

    await act(async () => {
      await result.current.handleConfirmModal();
    });

    expect(getItems()[0]?.replies).toHaveLength(1);
    expect(getItems()[0]?.replies[0]?.id).toBe('reply-1');
    expect(pushToast).toHaveBeenCalledWith('삭제 실패', 'error');
  });

  it('원댓글 삭제 action이 ok=false를 반환하면 optimistic removal을 되돌린다', async () => {
    const thread = createThreadFixture('thread-1');
    vi.mocked(deleteGuestbookEntryAction).mockResolvedValue({
      data: null,
      errorCode: null,
      errorMessage: 'failed',
      ok: false,
    });

    const { getItems, pushToast, result } = renderActionModalHook([thread]);

    act(() => {
      result.current.openDeleteModal(thread);
    });

    await act(async () => {
      await result.current.handleConfirmModal();
    });

    expect(getItems()).toHaveLength(1);
    expect(getItems()[0]?.id).toBe('thread-1');
    expect(pushToast).toHaveBeenCalledWith('삭제 실패', 'error');
  });
});
