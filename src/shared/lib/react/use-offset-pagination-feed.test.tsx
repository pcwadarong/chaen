import { act, renderHook, waitFor } from '@testing-library/react';

import { useOffsetPaginationFeed } from './use-offset-pagination-feed';

describe('useOffsetPaginationFeed', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loadMore 호출 시 목록을 이어붙이고 nextCursor를 갱신한다', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [{ id: 'b' }],
      nextCursor: null,
    });

    const { result } = renderHook(() =>
      useOffsetPaginationFeed<{ id: string }>({
        initialCursor: '1',
        initialItems: [{ id: 'a' }],
        loadPage,
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
    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(loadPage).toHaveBeenCalledWith({
      cursor: '1',
      limit: 10,
      locale: 'ko',
      queryParams: undefined,
    });
  });

  it('요청 실패 시 errorMessage를 설정한다', async () => {
    const loadPage = vi.fn().mockRejectedValue(new Error('load failed'));

    const { result } = renderHook(() =>
      useOffsetPaginationFeed<{ id: string }>({
        initialCursor: '1',
        initialItems: [{ id: 'a' }],
        loadPage,
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

  it('queryParams를 함께 전달한다', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { result } = renderHook(() =>
      useOffsetPaginationFeed<{ id: string }>({
        initialCursor: '3',
        initialItems: [{ id: 'a' }],
        loadPage,
        locale: 'ko',
        queryParams: {
          q: 'react',
          tag: 'nextjs',
        },
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(loadPage).toHaveBeenCalledWith({
      cursor: '3',
      limit: 10,
      locale: 'ko',
      queryParams: {
        q: 'react',
        tag: 'nextjs',
      },
    });
  });

  it('초기 props가 바뀌면 items와 nextCursor를 새 값으로 재동기화한다', async () => {
    type HookProps = {
      initialCursor: string | null;
      initialItems: { id: string }[];
    };
    const loadPage = vi.fn();
    const initialProps: HookProps = {
      initialCursor: '1',
      initialItems: [{ id: 'a' }],
    };

    const { result, rerender } = renderHook(
      ({ initialCursor, initialItems }: HookProps) =>
        useOffsetPaginationFeed<{ id: string }>({
          initialCursor,
          initialItems,
          loadPage,
          locale: 'ko',
        }),
      {
        initialProps,
      },
    );

    rerender({
      initialCursor: null,
      initialItems: [{ id: 'b' }],
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: 'b' }]);
    });
    expect(result.current.hasMore).toBe(false);
  });
});
