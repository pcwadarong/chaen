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

  it('content schema 기준으로 최신순 아티클 요약 목록을 반환한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend',
            title: 'Frontend',
            description: 'detail',
            articles: {
              created_at: '2026-03-02T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
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
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(translationsQuery.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
      referencedTable: 'articles',
    });
    expect(translationsQuery.order).toHaveBeenNthCalledWith(2, 'article_id', {
      ascending: false,
    });
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('최근 base row에 번역이 없어도 locale 번역이 있는 아카이브 항목을 반환한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'older-fr-article',
            title: 'Frontend FR',
            description: 'detail fr',
            articles: {
              created_at: '2026-03-01T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailList('fr');

    expect(result).toEqual([
      {
        id: 'older-fr-article',
        title: 'Frontend FR',
        description: 'detail fr',
        created_at: '2026-03-01T00:00:00.000Z',
      },
    ]);
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.articles" does not exist',
        },
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleDetailList('ko')).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });
});
