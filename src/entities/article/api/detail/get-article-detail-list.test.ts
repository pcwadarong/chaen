// @vitest-environment node

import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import {
  getArticleDetailList,
  getArticleDetailListWindow,
} from '@/entities/article/api/detail/get-article-detail-list';
import { parseLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
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
 */
const createQueryMock = ({
  result,
  terminalCall = 1,
  terminalMethod,
}: {
  result: QueryResult;
  terminalCall?: number;
  terminalMethod: 'in' | 'limit';
}) => {
  const query = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn(() =>
      terminalMethod === 'in' && query.in.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    limit: vi
      .fn()
      .mockResolvedValue(terminalMethod === 'limit' ? result : { data: null, error: null }),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  };

  return query;
};

describe('getArticleDetailList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('content schema 기준으로 최신순 아티클 요약 목록을 반환한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'frontend',
            publish_at: '2026-03-02T00:00:00.000Z',
            slug: 'frontend',
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
            article_id: 'frontend',
            locale: 'ko',
            title: 'Frontend',
            description: 'detail',
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
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailList({ locale: 'ko' });

    expect(result).toEqual({
      items: [
        {
          id: 'frontend',
          title: 'Frontend',
          description: 'detail',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'frontend',
        },
      ],
      nextCursor: null,
    });
    expect(articlesQuery.or).toHaveBeenCalledWith('publish_at.lte.2026-03-11T12:00:00.000Z');
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ko', 'en', 'ja', 'fr']);
    expect(unstable_cacheTag).toHaveBeenCalledWith('articles');
  });

  it('limit보다 많은 결과가 있으면 요청 locale을 포함한 다음 cursor를 반환한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-2',
            publish_at: '2026-03-02T00:00:00.000Z',
            slug: 'article-2',
          },
          {
            id: 'article-1',
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'article-1',
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
            article_id: 'article-2',
            locale: 'fr',
            title: 'Article Two',
            description: 'detail',
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
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailList({ locale: 'fr', limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(parseLocaleAwarePublishedAtIdCursor(result.nextCursor)).toEqual({
      id: 'article-2',
      locale: 'fr',
      publishedAt: '2026-03-02T00:00:00.000Z',
    });
  });

  it('요청 locale 번역이 없어도 fallback locale 아카이브 항목을 반환한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'english-archive',
            publish_at: '2026-03-03T00:00:00.000Z',
            slug: 'english-archive',
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
            article_id: 'english-archive',
            locale: 'en',
            title: 'English Archive',
            description: 'detail en',
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
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailList({ locale: 'fr' });

    expect(result).toEqual({
      items: [
        {
          id: 'english-archive',
          title: 'English Archive',
          description: 'detail en',
          publish_at: '2026-03-03T00:00:00.000Z',
          slug: 'english-archive',
        },
      ],
      nextCursor: null,
    });
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
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleDetailList({ locale: 'ko' })).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });

  it('권한 오류는 base row 조회 실패로 전파한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'permission denied for table articles',
        },
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleDetailList({ locale: 'ko' })).rejects.toThrow(
      '[articles] 상세 목록 base row 조회 실패: permission denied for table articles',
    );
  });
});

describe('getArticleDetailListWindow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('현재 글 아래쪽을 우선 채우고 부족하면 위쪽 최근 글로 앞을 메운다', async () => {
    const olderArticlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'older-1',
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'older-1',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const olderTranslationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'older-1',
            locale: 'ko',
            title: 'Older One',
            description: 'older summary',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const newerArticlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'newer-2',
            publish_at: '2026-03-04T00:00:00.000Z',
            slug: 'newer-2',
          },
          {
            id: 'newer-3',
            publish_at: '2026-03-05T00:00:00.000Z',
            slug: 'newer-3',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const newerTranslationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'newer-2',
            locale: 'ko',
            title: 'Newer Two',
            description: 'newer summary 2',
          },
          {
            article_id: 'newer-3',
            locale: 'ko',
            title: 'Newer Three',
            description: 'newer summary 3',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi
        .fn()
        .mockImplementationOnce((table: string) => {
          if (table === 'articles') return olderArticlesQuery;
          throw new Error(`unexpected table: ${table}`);
        })
        .mockImplementationOnce((table: string) => {
          if (table === 'article_translations') return olderTranslationsQuery;
          throw new Error(`unexpected table: ${table}`);
        })
        .mockImplementationOnce((table: string) => {
          if (table === 'articles') return newerArticlesQuery;
          throw new Error(`unexpected table: ${table}`);
        })
        .mockImplementationOnce((table: string) => {
          if (table === 'article_translations') return newerTranslationsQuery;
          throw new Error(`unexpected table: ${table}`);
        }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticleDetailListWindow({
      currentItem: {
        description: 'current summary',
        id: 'current',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'current',
        title: 'Current Article',
      },
      limit: 4,
      locale: 'ko',
    });

    expect(result).toEqual({
      items: [
        {
          id: 'newer-3',
          title: 'Newer Three',
          description: 'newer summary 3',
          publish_at: '2026-03-05T00:00:00.000Z',
          slug: 'newer-3',
        },
        {
          id: 'newer-2',
          title: 'Newer Two',
          description: 'newer summary 2',
          publish_at: '2026-03-04T00:00:00.000Z',
          slug: 'newer-2',
        },
        {
          id: 'current',
          title: 'Current Article',
          description: 'current summary',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'current',
        },
        {
          id: 'older-1',
          title: 'Older One',
          description: 'older summary',
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'older-1',
        },
      ],
      nextCursor: null,
    });
    expect(newerArticlesQuery.or).toHaveBeenCalledWith(
      expect.stringContaining('publish_at.gt.2026-03-02T00:00:00.000Z),and(publish_at.lte.'),
    );
    expect(newerArticlesQuery.or).toHaveBeenCalledWith(
      expect.stringContaining('publish_at.eq.2026-03-02T00:00:00.000Z,id.gt.current)'),
    );
  });
});
