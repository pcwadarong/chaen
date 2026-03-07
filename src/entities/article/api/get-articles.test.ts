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

  it('첫 페이지 조회는 keyset cache key에 initial cursor를 포함한다', async () => {
    const articleQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'typography-rhythm',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(articleQuery),
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBeNull();
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'articles',
      'list',
      'supabase-enabled',
      'ko',
      'initial',
      '12',
      '',
      '',
    ]);
  });

  it('비검색 다음 페이지 조회는 created_at + id keyset 조건을 사용한다', async () => {
    const articleQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(articleQuery),
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-03-02T09:07:50.797695+00:00',
        id: 'article-9',
      }),
      'utf-8',
    ).toString('base64url');

    await getArticles({ cursor, locale: 'ko' });

    expect(articleQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.article-9)',
    );
  });

  it('첫 페이지에서 대상 locale 결과가 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const koreanFallbackQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'frontend-performance',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(targetLocaleQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(koreanFallbackQuery),
        }),
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

  it('검색어가 있으면 rank + created_at + id keyset cursor로 RPC 검색을 호출한다', async () => {
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
            search_rank: 0.9,
            total_count: 19,
          },
          {
            id: 'react-next',
            title: 'React Next',
            description: 'server components',
            content: '...',
            thumbnail_url: null,
            created_at: '2026-03-01T09:07:50.797695+00:00',
            search_rank: 0.7,
            total_count: 19,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko', limit: 1, query: 'react' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('react-start');
    expect(result.totalCount).toBe(19);
    expect(result.nextCursor).not.toBeNull();
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_articles', {
      cursor_created_at: null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: 1,
      search_query: 'react',
      target_locale: 'ko',
    });
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
      cursor_created_at: null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: 12,
      search_query: 'react',
      target_locale: 'fr',
    });
  });

  it('태그가 있으면 관계형 태그 테이블 기준으로 목록을 조회한다', async () => {
    const tagsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'tag-1' },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const articleTagsQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const articleQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    articleTagsQuery.eq.mockReturnValueOnce(articleTagsQuery).mockReturnValueOnce(
      Promise.resolve({
        data: [{ article_id: 'article-1' }, { article_id: 'article-2' }],
        error: null,
      }),
    );
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(tagsQuery)
        .mockReturnValueOnce(articleTagsQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(articleQuery),
        }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await getArticles({ locale: 'ko', tag: 'nextjs' });

    expect(tagsQuery.eq).toHaveBeenCalledWith('slug', 'nextjs');
    expect(articleTagsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(articleQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(articleQuery.in).toHaveBeenCalledWith('id', ['article-1', 'article-2']);
  });
});
