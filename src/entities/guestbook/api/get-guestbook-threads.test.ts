import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getGuestbookThreads } from './get-guestbook-threads';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getGuestbookThreads', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 빈 데이터를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getGuestbookThreads({});

    expect(result).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('Supabase env가 있으면 원댓글/대댓글을 묶어서 반환한다', async () => {
    const parentQuery = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'parent-1',
            parent_id: null,
            author_name: 'guest',
            author_blog_url: null,
            content: '안녕하세요',
            is_secret: false,
            is_admin_reply: false,
            created_at: '2026-03-05T00:00:00.000Z',
            updated_at: '2026-03-05T00:00:00.000Z',
            deleted_at: null,
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
            id: 'reply-1',
            parent_id: 'parent-1',
            author_name: 'admin',
            author_blog_url: null,
            content: '답글입니다',
            is_secret: false,
            is_admin_reply: true,
            created_at: '2026-03-05T00:10:00.000Z',
            updated_at: '2026-03-05T00:10:00.000Z',
            deleted_at: null,
          },
        ],
        error: null,
      }),
    };

    const supabaseClient = {
      from: vi.fn((tableName: string) => {
        if (tableName === 'guestbook_entries') {
          const callCount = supabaseClient.from.mock.calls.length;
          return callCount === 1 ? parentQuery : replyQuery;
        }

        return parentQuery;
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getGuestbookThreads({ limit: 12 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.replies).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
    expect(unstable_cache).toHaveBeenCalledTimes(2);
    expect(parentQuery.is).toHaveBeenCalledWith('parent_id', null);
    expect(parentQuery.is).not.toHaveBeenCalledWith('deleted_at', null);
    expect(replyQuery.eq).toHaveBeenCalledWith('parent_id', 'parent-1');
  });

  it('삭제된 원댓글은 답글이 없으면 목록에서 제외한다', async () => {
    const parentQuery = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'parent-deleted',
            parent_id: null,
            author_name: 'guest',
            author_blog_url: null,
            content: '',
            is_secret: false,
            is_admin_reply: false,
            created_at: '2026-03-05T00:00:00.000Z',
            updated_at: '2026-03-05T00:00:00.000Z',
            deleted_at: '2026-03-06T00:00:00.000Z',
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
        data: [],
        error: null,
      }),
    };

    const supabaseClient = {
      from: vi.fn((tableName: string) => {
        if (tableName === 'guestbook_entries') {
          const callCount = supabaseClient.from.mock.calls.length;
          return callCount === 1 ? parentQuery : replyQuery;
        }

        return parentQuery;
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getGuestbookThreads({ limit: 12 });

    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});
