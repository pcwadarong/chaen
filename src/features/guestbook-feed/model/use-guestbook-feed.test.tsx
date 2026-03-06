import { act, renderHook, waitFor } from '@testing-library/react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';

import { useGuestbookFeed } from './use-guestbook-feed';

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
  is_admin_reply: false,
  is_secret: false,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-05T00:00:00.000Z',
});

/**
 * JSON 응답 객체를 생성합니다.
 */
const createJsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

describe('useGuestbookFeed', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('마운트 시 초기 목록을 조회하고 상태를 반영한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        items: [createThreadFixture('entry-1')],
        nextCursor: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useGuestbookFeed());

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.errorMessage).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/guestbook/threads?limit=12');
  });

  it('초기 조회 실패 시 errorMessage를 설정한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          reason: 'failed initial load',
          items: [],
          nextCursor: null,
        },
        500,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useGuestbookFeed());

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe('failed initial load');
  });

  it('초기 데이터가 있으면 첫 마운트 fetch를 생략한다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useGuestbookFeed({
        initialCursor: '12',
        initialItems: [createThreadFixture('entry-1')],
      }),
    );

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('다음 페이지 조회 실패 시 errorMessage를 설정한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          items: [createThreadFixture('entry-1')],
          nextCursor: '2',
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            reason: 'failed load more',
            items: [],
            nextCursor: null,
          },
          500,
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useGuestbookFeed());

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

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('cursor=2');
  });
});
