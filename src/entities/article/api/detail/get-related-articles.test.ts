import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import { getRelatedTagIds } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getRelatedTagIds: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getRelatedArticles', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 빈 목록을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    await expect(
      getRelatedArticles({
        articleId: 'article-1',
        locale: 'ko',
      }),
    ).resolves.toEqual([]);
  });

  it('공통 태그 수 기준 후보를 locale fallback 번역과 함께 반환한다', async () => {
    const articleTagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { article_id: 'article-2', tag_id: 'tag-a' },
          { article_id: 'article-2', tag_id: 'tag-b' },
          { article_id: 'article-3', tag_id: 'tag-a' },
        ],
        error: null,
      }),
      neq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const translationResult = {
      data: [
        {
          article_id: 'article-2',
          locale: 'ko',
          title: 'Shared Two',
          description: 'two tags',
          articles: {
            created_at: '2026-03-02T00:00:00.000Z',
            id: 'article-2',
            publish_at: '2026-03-02T00:00:00.000Z',
            slug: 'article-2-slug',
            thumbnail_url: null,
          },
        },
        {
          article_id: 'article-3',
          locale: 'en',
          title: 'Shared Three',
          description: 'fallback locale',
          articles: {
            created_at: '2026-03-01T00:00:00.000Z',
            id: 'article-3',
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'article-3-slug',
            thumbnail_url: null,
          },
        },
      ],
      error: null,
    };
    const translationsQuery = {
      in: vi.fn(),
      not: vi.fn(),
      select: vi.fn().mockReturnThis(),
    };
    translationsQuery.in
      .mockImplementationOnce(() => translationsQuery)
      .mockImplementationOnce(() => translationsQuery);
    translationsQuery.not
      .mockImplementationOnce(() => translationsQuery)
      .mockImplementationOnce(() => Promise.resolve(translationResult));
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleTagsQuery).mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(getRelatedTagIds).mockResolvedValue({
      data: ['tag-a', 'tag-b'],
      schemaMissing: false,
    });
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(
      getRelatedArticles({
        articleId: 'article-1',
        limit: 2,
        locale: 'fr',
      }),
    ).resolves.toEqual([
      {
        id: 'article-2',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'article-2-slug',
        title: 'Shared Two',
        description: 'two tags',
        thumbnail_url: null,
      },
      {
        id: 'article-3',
        publish_at: '2026-03-01T00:00:00.000Z',
        slug: 'article-3-slug',
        title: 'Shared Three',
        description: 'fallback locale',
        thumbnail_url: null,
      },
    ]);

    expect(getRelatedTagIds).toHaveBeenCalledWith({
      entityColumn: 'article_id',
      entityId: 'article-1',
      relationTable: 'article_tags',
    });
  });

  it('공통 태그 후보가 없으면 최근 글을 fallback으로 반환한다', async () => {
    const articleTagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      neq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const recentTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'article-9',
            locale: 'ko',
            title: 'Recent Article',
            description: 'latest fallback',
            articles: {
              created_at: '2026-03-03T00:00:00.000Z',
              id: 'article-9',
              publish_at: '2026-03-03T00:00:00.000Z',
              slug: 'article-9-slug',
              thumbnail_url: null,
            },
          },
        ],
        error: null,
      }),
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(articleTagsQuery)
        .mockReturnValueOnce(recentTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(getRelatedTagIds).mockResolvedValue({
      data: ['tag-a'],
      schemaMissing: false,
    });
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(
      getRelatedArticles({
        articleId: 'article-1',
        locale: 'ko',
      }),
    ).resolves.toEqual([
      {
        id: 'article-9',
        publish_at: '2026-03-03T00:00:00.000Z',
        slug: 'article-9-slug',
        title: 'Recent Article',
        description: 'latest fallback',
        thumbnail_url: null,
      },
    ]);
  });

  it('태그 schema가 없으면 최근 글 fallback만 사용한다', async () => {
    const recentTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(recentTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(getRelatedTagIds).mockResolvedValue({
      data: [],
      schemaMissing: true,
    });
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(
      getRelatedArticles({
        articleId: 'article-1',
        locale: 'ko',
      }),
    ).resolves.toEqual([]);
  });
});
