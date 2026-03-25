import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

describe('useOffsetPaginationFeed', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * 훅이 노출한 `loadMore`를 호출하고 상태 반영까지 한 번 감쌉니다.
   *
   * @param loadMore 다음 페이지를 불러오는 훅 함수입니다.
   */
  const triggerLoadMore = async (loadMore: () => Promise<void>) => {
    await act(async () => {
      await loadMore();
    });
  };

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

    const { result, rerender, unmount } = renderHook(
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

    try {
      rerender({
        initialCursor: null,
        initialItems: [{ id: 'b' }],
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([{ id: 'b' }]);
      });
      expect(result.current.hasMore).toBe(false);
    } finally {
      unmount();
    }
  });

  it('같은 seed를 새 배열로 다시 받아도 목록을 불필요하게 초기화하지 않는다', async () => {
    type HookProps = {
      initialCursor: string | null;
      initialItems: { id: string }[];
    };
    const seededItem = { id: 'a' };
    const loadPage = vi.fn().mockResolvedValue({
      items: [{ id: 'b' }],
      nextCursor: null,
    });

    const { result, rerender, unmount } = renderHook(
      ({ initialCursor, initialItems }: HookProps) =>
        useOffsetPaginationFeed<{ id: string }>({
          initialCursor,
          initialItems,
          loadPage,
          locale: 'ko',
        }),
      {
        initialProps: {
          initialCursor: '1',
          initialItems: [seededItem],
        },
      },
    );

    try {
      await triggerLoadMore(result.current.loadMore);

      rerender({
        initialCursor: '1',
        initialItems: [seededItem],
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([{ id: 'a' }, { id: 'b' }]);
      });
      expect(result.current.hasMore).toBe(false);
      expect(loadPage).toHaveBeenCalledTimes(1);
    } finally {
      unmount();
    }
  });
});
