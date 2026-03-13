import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import {
  deleteArticleAction,
  getArticleDetailArchivePageAction,
  getArticlesPageAction,
  incrementArticleViewCountAction,
} from './article-actions';
import { getArticleDetailList } from './get-article-detail-list';
import { getArticles } from './get-articles';
import { incrementArticleViewCount } from './increment-article-view-count';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
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
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
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

  it('조회수 증가 action은 최신 조회수만 반환하고 현재 route 캐시는 다시 검증하지 않는다', async () => {
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

  it('관리자 삭제 action은 article 연관 데이터와 공개 경로를 함께 정리하고 목록으로 이동한다', async () => {
    const articleCommentsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const articleTagsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const translationsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'content_id' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };
    const articlesDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'article_comments') return articleCommentsDeleteQuery;
        if (table === 'article_tags') return articleTagsDeleteQuery;
        if (table === 'article_translations') return translationsDeleteQuery;
        if (table === 'drafts') return draftsDeleteQuery;
        if (table === 'articles') return articlesDeleteQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await deleteArticleAction({
      articleId: 'article-1',
      articleSlug: 'article-1-slug',
      locale: 'ko',
    });

    expect(articleCommentsDeleteQuery.eq).toHaveBeenCalledWith('article_id', 'article-1');
    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(1, 'content_type', 'article');
    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(2, 'content_id', 'article-1');
    expect(revalidateTag).toHaveBeenCalledWith('articles');
    expect(revalidateTag).toHaveBeenCalledWith('article:article-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles/article-1-slug');
    expect(redirect).toHaveBeenCalledWith('/ko/articles');
  });
});
