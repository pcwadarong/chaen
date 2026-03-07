import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getArticleComments } from './get-article-comments';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticleComments', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 빈 페이지를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticleComments({ articleId: 'frontend' });

    expect(result).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    });
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('루트 댓글과 대댓글을 묶어 공개 페이지를 반환한다', async () => {
    const rootQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend',
            author_blog_url: null,
            author_name: 'guest',
            content: 'secret root',
            created_at: '2026-03-06T00:00:00.000Z',
            deleted_at: null,
            id: 'root-1',
            parent_id: null,
            password_hash: 'hash',
            reply_to_author_name: null,
            reply_to_comment_id: null,
            updated_at: '2026-03-06T00:00:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const replyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend',
            author_blog_url: null,
            author_name: 'reply-user',
            content: 'reply',
            created_at: '2026-03-06T00:01:00.000Z',
            deleted_at: null,
            id: 'reply-1',
            parent_id: 'root-1',
            password_hash: 'hash',
            reply_to_author_name: 'guest',
            reply_to_comment_id: 'root-1',
            updated_at: '2026-03-06T00:01:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const supabaseClient = {
      from: vi.fn(() => {
        const callCount = supabaseClient.from.mock.calls.length;
        return callCount === 1 ? rootQuery : replyQuery;
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleComments({ articleId: 'frontend' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.content).toBe('secret root');
    expect(result.items[0]?.replies).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('삭제된 루트 댓글은 답글이 없으면 제외하고 페이지를 계산한다', async () => {
    const rootQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend',
            author_blog_url: null,
            author_name: 'guest-a',
            content: 'a',
            created_at: '2026-03-06T00:00:00.000Z',
            deleted_at: null,
            id: 'root-1',
            parent_id: null,
            password_hash: 'hash',
            reply_to_author_name: null,
            reply_to_comment_id: null,
            updated_at: '2026-03-06T00:00:00.000Z',
          },
          {
            article_id: 'frontend',
            author_blog_url: null,
            author_name: 'guest-b',
            content: '',
            created_at: '2026-03-06T00:01:00.000Z',
            deleted_at: '2026-03-06T00:02:00.000Z',
            id: 'root-2',
            parent_id: null,
            password_hash: 'hash',
            reply_to_author_name: null,
            reply_to_comment_id: null,
            updated_at: '2026-03-06T00:02:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const replyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi
        .fn()
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [],
          error: null,
        }),
    };

    const supabaseClient = {
      from: vi.fn(() => {
        const callCount = supabaseClient.from.mock.calls.length;
        return callCount === 1 ? rootQuery : replyQuery;
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleComments({ articleId: 'frontend', page: 3, pageSize: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('root-1');
    expect(result.page).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
