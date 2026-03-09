import { unstable_cache } from 'next/cache';
import { vi } from 'vitest';

import { parseLocaleAwareCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
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

    const result = await getArticleDetailList({ locale: 'ko' });

    expect(result).toEqual({
      items: [
        {
          id: 'frontend',
          title: 'Frontend',
          description: 'detail',
          created_at: '2026-03-02T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
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

  it('limit보다 많은 결과가 있으면 locale을 포함한 다음 cursor를 반환한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'article-2',
            title: 'Article Two',
            description: 'detail',
            articles: {
              created_at: '2026-03-02T00:00:00.000Z',
            },
          },
          {
            article_id: 'article-1',
            title: 'Article One',
            description: 'detail',
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

    const result = await getArticleDetailList({ locale: 'ko', limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(parseLocaleAwareCreatedAtIdCursor(result.nextCursor)).toEqual({
      createdAt: '2026-03-02T00:00:00.000Z',
      id: 'article-2',
      locale: 'ko',
    });
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

    const result = await getArticleDetailList({ locale: 'fr' });

    expect(result).toEqual({
      items: [
        {
          id: 'older-fr-article',
          title: 'Frontend FR',
          description: 'detail fr',
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
  });

  it('요청 locale과 ko가 비어 있으면 다음 fallback locale 아카이브 항목을 반환한다', async () => {
    const emptyTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const emptyKoTranslationsQuery = {
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
            article_id: 'english-archive',
            title: 'English Archive',
            description: 'detail en',
            articles: {
              created_at: '2026-03-03T00:00:00.000Z',
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
        .mockReturnValueOnce(emptyTranslationsQuery)
        .mockReturnValueOnce(emptyKoTranslationsQuery)
        .mockReturnValueOnce(fallbackTranslationsQuery),
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
          created_at: '2026-03-03T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(emptyTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(emptyKoTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(fallbackTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'en');
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

    await expect(getArticleDetailList({ locale: 'ko' })).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });
});
