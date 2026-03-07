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

  it('첫 페이지 조회는 shadow schema를 우선 사용하고 keyset cache key에 initial cursor를 포함한다', async () => {
    const articleBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'typography-rhythm',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
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
            article_id: 'typography-rhythm',
            title: 'Typography Rhythm',
            description: 'line-height note',
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

    const result = await getArticles({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBeNull();
    expect(result.items[0]?.title).toBe('Typography Rhythm');
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

  it('비검색 다음 페이지 조회는 shadow base table에도 created_at + id keyset 조건을 사용한다', async () => {
    const articleBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(articleBaseQuery),
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

    expect(articleBaseQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.article-9)',
    );
  });

  it('첫 페이지에서 대상 locale 번역이 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            title: '한국어 글',
            description: '설명',
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
          select: vi.fn().mockReturnValue(targetLocaleBaseQuery),
        })
        .mockReturnValueOnce(targetLocaleTranslationsQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fallbackBaseQuery),
        })
        .mockReturnValueOnce(fallbackTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'fr' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('한국어 글');
    expect(targetLocaleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(fallbackTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('검색어가 있으면 shadow search RPC를 우선 호출한다', async () => {
    const supabaseClient = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'react-start',
            title: 'React Start',
            description: 'client rendering',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            search_rank: 0.9,
            total_count: 19,
          },
          {
            id: 'react-next',
            title: 'React Next',
            description: 'server components',
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
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_article_translations', {
      cursor_created_at: null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: 1,
      search_query: 'react',
      target_locale: 'ko',
    });
  });

  it('search_article_translations RPC 에러는 그대로 surface한다', async () => {
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'rpc failed',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'fr', query: 'react' })).rejects.toThrow(
      '[articles] shadow RPC 검색 조회 실패: rpc failed',
    );

    expect(supabaseClient.from).not.toHaveBeenCalled();
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_article_translations', {
      cursor_created_at: null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: 12,
      search_query: 'react',
      target_locale: 'fr',
    });
  });

  it('태그가 있으면 shadow 태그 relation과 shadow article base를 기준으로 목록을 조회한다', async () => {
    const tagsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'tag-1' },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [{ article_id: 'article-1' }, { article_id: 'article-2' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const articleBaseQuery = {
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'article-2',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'article-2',
            title: 'Article Two',
            description: 'description',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(tagsQuery)
        .mockReturnValueOnce(articleTagsV2Query)
        .mockReturnValueOnce(articleBaseQuery)
        .mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko', tag: 'nextjs' });

    expect(result.items[0]?.id).toBe('article-2');
    expect(tagsQuery.eq).toHaveBeenCalledWith('slug', 'nextjs');
    expect(articleBaseQuery.in).toHaveBeenCalledWith('id', ['article-1', 'article-2']);
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('태그 schema가 없으면 legacy text 배열 fallback 대신 에러를 던진다', async () => {
    const tagsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(tagsQuery),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko', tag: 'nextjs' })).rejects.toThrow(
      '[articles] 태그 schema가 없습니다.',
    );
  });
});
