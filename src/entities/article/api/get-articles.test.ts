import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getArticles } from './get-articles';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticles', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 빈 페이지를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticles({ locale: 'ko' });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
      totalCount: null,
    });
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('Supabase env가 있으면 캐시 키에 scope/offset/limit를 포함해 조회한다', async () => {
    const articleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'typography-rhythm',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBeNull();
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'articles',
      'list',
      'supabase-enabled',
      'ko',
      '0',
      '12',
      '',
    ]);
  });

  it('첫 페이지에서 대상 locale 결과가 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    const koreanFallbackQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'frontend-performance',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(targetLocaleQuery).mockReturnValueOnce(koreanFallbackQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'fr' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('frontend-performance');
    expect(result.totalCount).toBeNull();
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
    expect(targetLocaleQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanFallbackQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('검색어가 있으면 RPC 검색을 호출하고 totalCount를 반환한다', async () => {
    const supabaseClient = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'react-start',
            title: 'React Start',
            description: 'client rendering',
            content: '...',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            total_count: 19,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko', query: 'react' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('react-start');
    expect(result.totalCount).toBe(19);
    expect(result.nextCursor).toBe('12');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_articles', {
      page_limit: 12,
      page_offset: 0,
      search_query: 'react',
      target_locale: 'ko',
    });
    expect(vi.mocked(unstable_cache).mock.calls.at(-1)?.[1]).toEqual([
      'articles',
      'list',
      'supabase-enabled',
      'ko',
      '0',
      '12',
      'react',
    ]);
  });

  it('검색어가 있으면 locale fallback 없이 target locale만 RPC에 전달한다', async () => {
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await getArticles({ locale: 'fr', query: 'react' });

    expect(supabaseClient.from).not.toHaveBeenCalled();
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_articles', {
      page_limit: 12,
      page_offset: 0,
      search_query: 'react',
      target_locale: 'fr',
    });
  });
});
