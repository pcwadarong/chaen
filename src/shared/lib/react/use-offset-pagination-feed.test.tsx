import { act, renderHook, waitFor } from '@testing-library/react';

import { useOffsetPaginationFeed } from './use-offset-pagination-feed';

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

describe('useOffsetPaginationFeed', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('loadMore 호출 시 목록을 이어붙이고 nextCursor를 갱신한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        items: [{ id: 'b' }],
        nextCursor: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useOffsetPaginationFeed<{ id: string }>({
        endpoint: '/api/test',
        initialCursor: '1',
        initialItems: [{ id: 'a' }],
        locale: 'ko',
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false);
    });

    expect(result.current.items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.current.hasMore).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/test?locale=ko&limit=12&cursor=1');
  });

  it('요청 실패 시 errorMessage를 설정한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          reason: 'load failed',
        },
        500,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useOffsetPaginationFeed<{ id: string }>({
        endpoint: '/api/test',
        initialCursor: '1',
        initialItems: [{ id: 'a' }],
        locale: 'ko',
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('load failed');
    });
  });
});
