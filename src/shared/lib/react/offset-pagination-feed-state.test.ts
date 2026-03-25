// @vitest-environment node

import { resolveOffsetPaginationLoadMore } from '@/shared/lib/react/offset-pagination-feed-state';

describe('resolveOffsetPaginationLoadMore', () => {
  it('loadMore 성공 시 목록을 이어붙이고 nextCursor를 갱신한다', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [{ id: 'b' }],
      nextCursor: null,
    });

    const result = await resolveOffsetPaginationLoadMore({
      currentCursor: '1',
      currentItems: [{ id: 'a' }],
      limit: 10,
      loadPage,
      locale: 'ko',
    });

    expect(result).toEqual({
      errorMessage: null,
      items: [{ id: 'a' }, { id: 'b' }],
      nextCursor: null,
    });
    expect(loadPage).toHaveBeenCalledWith({
      cursor: '1',
      limit: 10,
      locale: 'ko',
      queryParams: undefined,
    });
  });

  it('요청 실패 시 기존 목록과 cursor를 유지하고 errorMessage를 반환한다', async () => {
    const loadPage = vi.fn().mockRejectedValue(new Error('load failed'));

    const result = await resolveOffsetPaginationLoadMore({
      currentCursor: '1',
      currentItems: [{ id: 'a' }],
      limit: 10,
      loadPage,
      locale: 'ko',
    });

    expect(result).toEqual({
      errorMessage: 'load failed',
      items: [{ id: 'a' }],
      nextCursor: '1',
    });
  });

  it('queryParams를 함께 전달한다', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    await resolveOffsetPaginationLoadMore({
      currentCursor: '3',
      currentItems: [{ id: 'a' }],
      limit: 10,
      loadPage,
      locale: 'ko',
      queryParams: {
        q: 'react',
        tag: 'nextjs',
      },
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
});
