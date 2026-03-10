import { unstable_cacheTag } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getArticles, getResolvedArticlesFirstPage } from './get-articles';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
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

  it('Supabase env가 없으면 articles cache tag를 기록하지 않고 빈 페이지를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticles({ locale: 'ko' });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
      totalCount: null,
    });
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('첫 페이지 조회는 locale 번역을 먼저 기준으로 조회하고 articles cache tag를 기록한다', async () => {
    const articleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'typography-rhythm',
            title: 'Typography Rhythm',
            description: 'line-height note',
            articles: {
              thumbnail_url: null,
              created_at: '2026-03-02T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBeNull();
    expect(result.items[0]?.title).toBe('Typography Rhythm');
    expect(articleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(articleTranslationsQuery.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
      referencedTable: 'articles',
    });
    expect(articleTranslationsQuery.order).toHaveBeenNthCalledWith(2, 'article_id', {
      ascending: false,
    });
    expect(unstable_cacheTag).toHaveBeenCalledWith('articles');
  });

  it('비검색 다음 페이지 조회는 locale 번역 목록에도 created_at + id keyset 조건을 사용한다', async () => {
    const articleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleTranslationsQuery),
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

    expect(articleTranslationsQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.article-9)',
      {
        referencedTable: 'articles',
      },
    );
  });

  it('최근 base row에 번역이 없어도 locale 번역이 있으면 ko fallback 없이 localized 목록을 반환한다', async () => {
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'older-fr-article',
            title: 'Article FR',
            description: 'description fr',
            articles: {
              thumbnail_url: null,
              created_at: '2026-03-01T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(targetLocaleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'fr' });

    expect(result.items).toEqual([
      {
        id: 'older-fr-article',
        title: 'Article FR',
        description: 'description fr',
        thumbnail_url: null,
        created_at: '2026-03-01T09:07:50.797695+00:00',
      },
    ]);
    expect(supabaseClient.from).toHaveBeenCalledTimes(1);
    expect(targetLocaleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
  });

  it('첫 페이지에서 대상 locale 번역이 정말 없으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            title: '한국어 글',
            description: '설명',
            articles: {
              thumbnail_url: null,
              created_at: '2026-03-02T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(targetLocaleTranslationsQuery)
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

  it('resolved 첫 페이지 조회는 실제 fallback locale을 함께 반환한다', async () => {
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            title: '한국어 글',
            description: '설명',
            articles: {
              thumbnail_url: null,
              created_at: '2026-03-02T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(targetLocaleTranslationsQuery)
        .mockReturnValueOnce(fallbackTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getResolvedArticlesFirstPage({ locale: 'fr' });

    expect(result.resolvedLocale).toBe('ko');
    expect(result.page.items[0]?.title).toBe('한국어 글');
  });

  it('검색어가 있으면 검색 RPC를 우선 호출한다', async () => {
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
      '[articles] 검색 조회 실패: rpc failed',
    );

    expect(supabaseClient.from).not.toHaveBeenCalled();
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_article_translations', {
      cursor_created_at: null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: 10,
      search_query: 'react',
      target_locale: 'fr',
    });
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

  it('태그 relation schema가 없으면 명시적 에러를 던진다', async () => {
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
        data: null,
        error: {
          message: 'relation "public.article_tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(tagsQuery).mockReturnValueOnce(articleTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko', tag: 'nextjs' })).rejects.toThrow(
      '[articles] 태그 relation schema가 없습니다.',
    );
  });

  it('content schema가 없으면 locale-row fallback 대신 에러를 던진다', async () => {
    const articleTranslationsQuery = {
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
      from: vi.fn().mockReturnValue(articleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko' })).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });

  it('relation 이름만 포함한 권한 오류는 content schema missing으로 오인하지 않는다', async () => {
    const articleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'permission denied for articles table',
        },
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko' })).rejects.toThrow(
      '[articles] 번역 목록 조회 실패: permission denied for articles table',
    );
  });

  it('태그 목록도 locale 번역 기준으로 먼저 페이지네이션한다', async () => {
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
        data: [{ article_id: 'recent-untranslated' }, { article_id: 'older-localized' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const articleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'older-localized',
            title: 'Article Two',
            description: 'description',
            articles: {
              thumbnail_url: null,
              created_at: '2026-03-01T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(tagsQuery)
        .mockReturnValueOnce(articleTagsV2Query)
        .mockReturnValueOnce(articleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko', tag: 'nextjs' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('older-localized');
    expect(articleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(articleTranslationsQuery.in).toHaveBeenCalledWith('article_id', [
      'recent-untranslated',
      'older-localized',
    ]);
  });
});
