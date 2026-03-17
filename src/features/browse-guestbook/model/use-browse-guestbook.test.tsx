import { act, renderHook, waitFor } from '@testing-library/react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { getGuestbookThreadsPage } from '@/features/browse-guestbook/api/get-guestbook-threads-page';
import { useBrowseGuestbook } from '@/features/browse-guestbook/model/use-browse-guestbook';

vi.mock('@/features/browse-guestbook/api/get-guestbook-threads-page', () => ({
  getGuestbookThreadsPage: vi.fn(),
}));

/**
 * 테스트에서 사용하는 스레드 fixture를 생성합니다.
 */
const createThreadFixture = (id: string): GuestbookThreadItem => ({
  author_blog_url: null,
  author_name: `author-${id}`,
  content: `content-${id}`,
  created_at: '2026-03-05T00:00:00.000Z',
  deleted_at: null,
  id,
  is_admin_author: false,
  is_secret: false,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-05T00:00:00.000Z',
});

describe('useBrowseGuestbook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('마운트 시 초기 목록을 조회하고 상태를 반영한다', async () => {
    vi.mocked(getGuestbookThreadsPage).mockResolvedValue({
      data: {
        items: [createThreadFixture('entry-1')],
        nextCursor: null,
      },
      errorMessage: null,
      ok: true,
    });

    const { result } = renderHook(() => useBrowseGuestbook({ locale: 'ko' }));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.errorMessage).toBeNull();
    expect(getGuestbookThreadsPage).toHaveBeenCalledTimes(1);
    expect(getGuestbookThreadsPage).toHaveBeenCalledWith({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });
  });

  it('초기 조회 실패 시 errorMessage를 설정한다', async () => {
    vi.mocked(getGuestbookThreadsPage).mockResolvedValue({
      data: null,
      errorMessage: 'failed initial load',
      ok: false,
    });

    const { result } = renderHook(() => useBrowseGuestbook({ locale: 'ko' }));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe('failed initial load');
  });

  it('초기 데이터가 있으면 첫 마운트 fetch를 생략한다', async () => {
    const { result } = renderHook(() =>
      useBrowseGuestbook({
        initialCursor: '12',
        initialItems: [createThreadFixture('entry-1')],
        locale: 'ko',
      }),
    );

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);
    expect(getGuestbookThreadsPage).not.toHaveBeenCalled();
  });

  it('다음 페이지 조회 실패 시 errorMessage를 설정한다', async () => {
    vi.mocked(getGuestbookThreadsPage)
      .mockResolvedValueOnce({
        data: {
          items: [createThreadFixture('entry-1')],
          nextCursor: '2',
        },
        errorMessage: null,
        ok: true,
      })
      .mockResolvedValueOnce({
        data: null,
        errorMessage: 'failed load more',
        ok: false,
      });

    const { result } = renderHook(() => useBrowseGuestbook({ locale: 'ko' }));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('failed load more');
    });

    expect(getGuestbookThreadsPage).toHaveBeenCalledTimes(2);
    expect(getGuestbookThreadsPage).toHaveBeenNthCalledWith(2, {
      cursor: '2',
      limit: 12,
      locale: 'ko',
    });
  });
});
