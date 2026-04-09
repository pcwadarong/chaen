// @vitest-environment node

import { unstable_cacheTag } from 'next/cache';

import {
  getArticles,
  getResolvedArticlesFirstPage,
} from '@/entities/article/api/list/get-articles';
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

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

/**
 * Supabase query builder mock을 생성합니다.
 *
 * 같은 메서드가 여러 번 호출되는 경우 마지막 지정 호출에서 Promise를 반환해
 * `await query.in(...).in(...)` 같은 체인을 테스트할 수 있게 합니다.
 */
const createQueryMock = ({
  result,
  terminalMethod,
  terminalCall = 1,
}: {
  result: QueryResult;
  terminalCall?: number;
  terminalMethod: 'eq' | 'in' | 'limit' | 'maybeSingle' | 'or';
}) => {
  const query = {
    eq: vi.fn(() =>
      terminalMethod === 'eq' && query.eq.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    in: vi.fn(() =>
      terminalMethod === 'in' && query.in.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    or: vi.fn(() =>
      terminalMethod === 'or' && query.or.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    limit: vi
      .fn()
      .mockResolvedValue(terminalMethod === 'limit' ? result : { data: null, error: null }),
    maybeSingle: vi
      .fn()
      .mockResolvedValue(terminalMethod === 'maybeSingle' ? result : { data: null, error: null }),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  };

  return query;
};

describe('getArticles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
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

  it('첫 페이지는 공개 base row를 먼저 읽고 각 row에 locale fallback 번역을 붙인다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-ja',
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'article-ja',
          },
          {
            id: 'article-ko-only',
            thumbnail_url: null,
            publish_at: '2026-03-01T09:07:50.797695+00:00',
            slug: 'article-ko-only',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-ja',
            locale: 'ja',
            title: 'Japanese Article',
            description: 'ja summary',
          },
          {
            article_id: 'article-ko-only',
            locale: 'ko',
            title: '한국어 글',
            description: 'ko summary',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ja' });

    expect(result.items).toEqual([
      {
        id: 'article-ja',
        title: 'Japanese Article',
        description: 'ja summary',
        thumbnail_url: null,
        publish_at: '2026-03-02T09:07:50.797695+00:00',
        slug: 'article-ja',
      },
      {
        id: 'article-ko-only',
        title: '한국어 글',
        description: 'ko summary',
        thumbnail_url: null,
        publish_at: '2026-03-01T09:07:50.797695+00:00',
        slug: 'article-ko-only',
      },
    ]);
    expect(articlesQuery.not).toHaveBeenCalledWith('publish_at', 'is', null);
    expect(articlesQuery.not).toHaveBeenCalledWith('slug', 'is', null);
    expect(articlesQuery.eq).toHaveBeenCalledWith('visibility', 'public');
    expect(articlesQuery.or).toHaveBeenCalledWith('publish_at.lte.2026-03-11T12:00:00.000Z');
    expect(articlesQuery.order).toHaveBeenNthCalledWith(1, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(articlesQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(translationsQuery.in).toHaveBeenNthCalledWith(1, 'article_id', [
      'article-ja',
      'article-ko-only',
    ]);
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ja', 'ko', 'en', 'fr']);
    expect(unstable_cacheTag).toHaveBeenCalledWith('articles');
  });

  it('다음 페이지 조회는 공개 base row에도 publish_at + id keyset 조건을 사용한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const cursor = Buffer.from(
      JSON.stringify({
        id: 'article-9',
        publishedAt: '2026-03-02T09:07:50.797695+00:00',
      }),
      'utf-8',
    ).toString('base64url');

    await getArticles({ cursor, locale: 'ko' });

    expect(articlesQuery.or).toHaveBeenCalledWith(
      'and(publish_at.lte.2026-03-11T12:00:00.000Z,publish_at.lt.2026-03-02T09:07:50.797695+00:00),and(publish_at.lte.2026-03-11T12:00:00.000Z,publish_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.article-9)',
    );
  });

  it('resolved 첫 페이지 결과의 locale을 요청 locale로 기록한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-ko-only',
            thumbnail_url: null,
            publish_at: '2026-03-01T09:07:50.797695+00:00',
            slug: 'article-ko-only',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-ko-only',
            locale: 'ko',
            title: '한국어 글',
            description: 'ko summary',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getResolvedArticlesFirstPage({ locale: 'fr' });

    expect(result.resolvedLocale).toBe('fr');
    expect(result.page.items[0]?.title).toBe('한국어 글');
  });

  it('base row가 limit + 1개면 번역을 결합한 뒤에도 다음 cursor를 반환한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: Array.from({ length: 11 }, (_, index) => ({
          id: `article-${11 - index}`,
          thumbnail_url: null,
          publish_at: `2026-03-${String(11 - index).padStart(2, '0')}T09:07:50.797695+00:00`,
          slug: `article-${11 - index}`,
        })),
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: Array.from({ length: 11 }, (_, index) => ({
          article_id: `article-${11 - index}`,
          locale: 'ko',
          title: `한국어 글 ${11 - index}`,
          description: `요약 ${11 - index}`,
        })),
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ limit: 10, locale: 'ko' });

    expect(result.items).toHaveLength(10);
    expect(result.nextCursor).not.toBeNull();
  });

  it('검색어가 있으면 검색 RPC를 publish_at cursor 계약으로 호출한다', async () => {
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'react-start',
            title: 'React Start',
            description: 'client rendering',
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'react-start',
            search_rank: 0.9,
            total_count: 19,
          },
          {
            id: 'react-next',
            title: 'React Next',
            description: 'server components',
            thumbnail_url: null,
            publish_at: '2026-03-01T09:07:50.797695+00:00',
            slug: 'react-next',
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
    expect(supabaseClient.rpc).toHaveBeenCalledWith('search_article_translations', {
      cursor_id: null,
      cursor_publish_at: null,
      cursor_rank: null,
      fallback_locales: ['ko', 'en', 'ja', 'fr'],
      page_limit: 1,
      search_query: 'react',
    });
  });

  it('검색 RPC가 배포되지 않았으면 title/description fallback 검색 결과를 반환한다', async () => {
    const searchTranslationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-naver',
            locale: 'ko',
            title: '네이버 글',
            description: '검색 설명',
          },
        ],
        error: null,
      },
      terminalMethod: 'or',
    });
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-naver',
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'naver-post',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const displayTranslationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-naver',
            locale: 'ko',
            title: '네이버 글',
            description: '검색 설명',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    let articleTranslationsReadCount = 0;
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') {
          articleTranslationsReadCount += 1;
          return articleTranslationsReadCount === 1
            ? searchTranslationsQuery
            : displayTranslationsQuery;
        }

        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message:
            'Could not find the function public.search_article_translations(search_query, fallback_locales, page_limit, cursor_rank, cursor_publish_at, cursor_id) in the schema cache',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ko', query: 'react' });

    expect(result).toEqual({
      items: [
        {
          id: 'article-naver',
          title: '네이버 글',
          description: '검색 설명',
          thumbnail_url: null,
          publish_at: '2026-03-02T09:07:50.797695+00:00',
          slug: 'naver-post',
        },
      ],
      nextCursor: null,
      totalCount: 1,
    });
    expect(searchTranslationsQuery.in).toHaveBeenCalledWith('locale', ['ko', 'en', 'ja', 'fr']);
    expect(searchTranslationsQuery.or).toHaveBeenCalledWith(
      'title.ilike.%react%,description.ilike.%react%',
    );
    expect(articlesQuery.in).toHaveBeenCalledWith('id', ['article-naver']);
  });

  it('태그 schema가 없으면 에러를 던진다', async () => {
    const tagsQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'relation "public.tags" does not exist',
        },
      },
      terminalMethod: 'maybeSingle',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'tags') return tagsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko', tag: 'nextjs' })).rejects.toThrow(
      '[articles] 태그 schema가 없습니다.',
    );
  });

  it('태그 목록도 공개 base row 기준으로 페이지네이션한 뒤 fallback 번역을 붙인다', async () => {
    const tagsQuery = createQueryMock({
      result: {
        data: { id: 'tag-1' },
        error: null,
      },
      terminalMethod: 'maybeSingle',
    });
    const articleTagsQuery = createQueryMock({
      result: {
        data: [{ article_id: 'article-ja' }, { article_id: 'article-ko-only' }],
        error: null,
      },
      terminalMethod: 'eq',
    });
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-ja',
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'article-ja',
          },
          {
            id: 'article-ko-only',
            thumbnail_url: null,
            publish_at: '2026-03-01T09:07:50.797695+00:00',
            slug: 'article-ko-only',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-ja',
            locale: 'ja',
            title: 'Japanese Article',
            description: 'ja summary',
          },
          {
            article_id: 'article-ko-only',
            locale: 'ko',
            title: '한국어 글',
            description: 'ko summary',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'tags') return tagsQuery;
        if (table === 'article_tags') return articleTagsQuery;
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticles({ locale: 'ja', tag: 'nextjs' });

    expect(result.items).toHaveLength(2);
    expect(articlesQuery.in).toHaveBeenCalledWith('id', ['article-ja', 'article-ko-only']);
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ja', 'ko', 'en', 'fr']);
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'relation "public.articles" does not exist',
        },
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko' })).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });

  it('권한 오류는 base row 조회 실패로 전파한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'permission denied for articles table',
        },
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticles({ locale: 'ko' })).rejects.toThrow(
      '[articles] 공개 아티클 base row 조회 실패: permission denied for articles table',
    );
  });
});
