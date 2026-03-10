import { revalidateTag } from 'next/cache';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import {
  getArticleDetailArchivePageAction,
  getArticlesPageAction,
  incrementArticleViewCountAction,
} from './article-actions';
import { getArticleDetailList } from './get-article-detail-list';
import { getArticles } from './get-articles';
import { incrementArticleViewCount } from './increment-article-view-count';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('./get-articles', () => ({
  getArticles: vi.fn(),
}));

vi.mock('./get-article-detail-list', () => ({
  getArticleDetailList: vi.fn(),
}));

vi.mock('./increment-article-view-count', () => ({
  incrementArticleViewCount: vi.fn(),
}));

describe('article-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('아티클 목록 action은 정규화된 조건으로 목록을 조회한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    const result = await getArticlesPageAction({
      cursor: ' cursor-1 ',
      limit: 12,
      locale: 'ko',
      query: ' react ',
      tag: ' nextjs ',
    });

    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      limit: 12,
      locale: 'ko',
      query: 'react',
      tag: 'nextjs',
    });
    expect(result).toEqual({
      data: {
        items: [],
        nextCursor: null,
        totalCount: 0,
      },
      errorMessage: null,
      ok: true,
    });
  });

  it('아카이브 action은 상세 목록 조회 결과를 그대로 반환한다', async () => {
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [],
      nextCursor: 'cursor-2',
    });

    const result = await getArticleDetailArchivePageAction({
      cursor: null,
      limit: 10,
      locale: 'en',
    });

    expect(getArticleDetailList).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
      locale: 'en',
    });
    expect(result.ok).toBe(true);
    expect(result.data?.nextCursor).toBe('cursor-2');
  });

  it('조회수 증가 action은 쓰기 후 관련 캐시 태그를 갱신한다', async () => {
    vi.mocked(incrementArticleViewCount).mockResolvedValue(34);

    const result = await incrementArticleViewCountAction({
      articleId: 'article-1',
    });

    expect(getServerAuthState).toHaveBeenCalledTimes(1);
    expect(incrementArticleViewCount).toHaveBeenCalledWith('article-1');
    expect(revalidateTag).toHaveBeenCalledWith('articles');
    expect(revalidateTag).toHaveBeenCalledWith('article:article-1');
    expect(result).toEqual({
      data: {
        viewCount: 34,
      },
      errorMessage: null,
      ok: true,
    });
  });
});
