import { unstable_cacheTag } from 'next/cache';

import { getArticleComments } from '@/entities/article/comment/api/get-article-comments';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
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
    expect(unstable_cacheTag).not.toHaveBeenCalled();
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
    expect(result.totalCount).toBe(2);
    expect(vi.mocked(unstable_cacheTag).mock.calls.flat()).toContain('article-comments');
    expect(vi.mocked(unstable_cacheTag).mock.calls.flat()).toContain('article-comments:frontend');
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

  it('답글까지 포함한 화면 엔트리 수를 기준으로 댓글 페이지를 분할한다', async () => {
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
            content: 'root-a',
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
            content: 'root-b',
            created_at: '2026-03-06T00:10:00.000Z',
            deleted_at: null,
            id: 'root-2',
            parent_id: null,
            password_hash: 'hash',
            reply_to_author_name: null,
            reply_to_comment_id: null,
            updated_at: '2026-03-06T00:10:00.000Z',
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
          data: Array.from({ length: 9 }, (_, index) => ({
            article_id: 'frontend',
            author_blog_url: null,
            author_name: `reply-${index + 1}`,
            content: `reply-${index + 1}`,
            created_at: `2026-03-06T00:${String(index + 1).padStart(2, '0')}:00.000Z`,
            deleted_at: null,
            id: `reply-${index + 1}`,
            parent_id: 'root-1',
            password_hash: 'hash',
            reply_to_author_name: 'guest-a',
            reply_to_comment_id: 'root-1',
            updated_at: `2026-03-06T00:${String(index + 1).padStart(2, '0')}:00.000Z`,
          })),
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

    const result = await getArticleComments({
      articleId: 'frontend',
      page: 2,
      pageSize: 10,
    });

    expect(result.totalCount).toBe(11);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('root-2');
  });

  it('bypassCache가 true면 cacheTag를 거치지 않고 fresh read를 수행한다', async () => {
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
            content: 'fresh root',
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

    const supabaseClient = {
      from: vi.fn(() => rootQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleComments({ articleId: 'frontend', bypassCache: true });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('root-1');
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });
});
