import { unstable_cache } from 'next/cache';
import { vi } from 'vitest';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getArticleDetailList } from './get-article-detail-list';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticleDetailList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shadow schema 기준으로 최신순 아티클 요약 목록을 반환한다', async () => {
    const articleBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'frontend',
            created_at: '2026-03-02T00:00:00.000Z',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend',
            title: 'Frontend',
            description: 'detail',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(articleBaseQuery),
        })
        .mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailList('ko');

    expect(result).toEqual([
      {
        id: 'frontend',
        title: 'Frontend',
        description: 'detail',
        created_at: '2026-03-02T00:00:00.000Z',
      },
    ]);
    expect(articleBaseQuery.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(articleBaseQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('shadow schema가 없으면 명시적 에러를 던진다', async () => {
    const shadowBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.articles" does not exist',
        },
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce({
        select: vi.fn().mockReturnValue(shadowBaseQuery),
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleDetailList('ko')).rejects.toThrow(
      '[articles] shadow content schema가 없습니다.',
    );
  });
});
