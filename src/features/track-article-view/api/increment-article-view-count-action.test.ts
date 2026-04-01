// @vitest-environment node

import { revalidateTag } from 'next/cache';

import { incrementArticleViewCount } from '@/entities/article/api/mutations/increment-article-view-count';
import { incrementArticleViewCountAction } from '@/features/track-article-view/api/increment-article-view-count-action';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/entities/article/api/mutations/increment-article-view-count', () => ({
  incrementArticleViewCount: vi.fn(),
}));

describe('incrementArticleViewCountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('최신 조회수만 반환하고 현재 route 캐시는 다시 검증하지 않는다', async () => {
    vi.mocked(incrementArticleViewCount).mockResolvedValue(34);

    const result = await incrementArticleViewCountAction({
      articleId: 'article-1',
    });

    expect(getServerAuthState).toHaveBeenCalledTimes(1);
    expect(incrementArticleViewCount).toHaveBeenCalledWith('article-1');
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: {
        viewCount: 34,
      },
      errorMessage: null,
      ok: true,
    });
  });
});
