import { unstable_cacheTag } from 'next/cache';

import { getArticle } from '@/entities/article/api/detail/get-article';
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

const createArticleSlugLookupQuery = (id = 'frontend-performance') => ({
  eq: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({
    data: { id },
    error: null,
  }),
  select: vi.fn().mockReturnThis(),
});

describe('getArticle', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 null을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).toBeNull();
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('fallback RPC를 우선 사용하면서 캐시 키에 scope를 포함한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            locale: 'ko',
            title: 'Frontend Performance',
            description: 'rendering memo',
            content: '...',
            id: 'frontend-performance',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: '2026-03-03T09:07:50.797695+00:00',
            view_count: 12,
          },
        ],
        error: null,
      }),
    };
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-1', slug: 'nextjs' },
          { id: 'tag-2', slug: 'performance' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(articleSlugQuery)
      .mockReturnValueOnce(articleTagsV2Query)
      .mockReturnValueOnce(tagsQuery);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).toMatchObject({
      id: 'frontend-performance',
      title: 'Frontend Performance',
      tags: ['nextjs', 'performance'],
    });
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['ko', 'en', 'ja', 'fr'],
      target_article_id: 'frontend-performance',
    });
    expect(articleSlugQuery.lte).toHaveBeenCalledTimes(1);
    expect(unstable_cacheTag).toHaveBeenCalledWith('articles', 'article:frontend-performance');
  });

  it('fallback RPC가 없으면 명시적 에러를 던진다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42883',
          message:
            'function public.get_article_translation_with_fallback(target_article_id, fallback_locales) does not exist',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });

  it('PostgREST missing function 코드는 content schema missing으로 본다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST202',
          message: 'Could not find the function public.get_article_translation_with_fallback',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] content schema가 없습니다.',
    );
  });

  it('권한 오류는 content schema missing으로 오인하지 않고 번역 조회 실패로 surface한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for function get_article_translation_with_fallback',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] 번역 조회 실패: permission denied for function get_article_translation_with_fallback',
    );
  });

  it('fallback 우선순위는 단일 RPC 호출에 전달한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            locale: 'ko',
            title: '한국어 글',
            description: '설명',
            content: '본문',
            id: 'frontend-performance',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: null,
            view_count: 3,
          },
        ],
        error: null,
      }),
    };
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(articleSlugQuery)
      .mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'fr');

    expect(result?.title).toBe('한국어 글');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['fr', 'ko', 'en', 'ja'],
      target_article_id: 'frontend-performance',
    });
  });

  it('ko도 없으면 en, ja 순서가 포함된 fallback 체인을 RPC에 전달한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            locale: 'ja',
            title: 'Japanese article',
            description: 'summary',
            content: 'body',
            id: 'frontend-performance',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: null,
            view_count: 3,
          },
        ],
        error: null,
      }),
    };
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(articleSlugQuery)
      .mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'fr');

    expect(result?.title).toBe('Japanese article');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['fr', 'ko', 'en', 'ja'],
      target_article_id: 'frontend-performance',
    });
  });

  it('fallback 후보 전체에 번역이 없으면 명시적 에러를 던진다', async () => {
    const articleSlugQuery = {
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'fr')).rejects.toThrow(
      '[articles] 조회 가능한 번역이 없습니다. articleSlug=frontend-performance locales=fr>ko>en>ja',
    );
  });

  it('slug로 들어온 상세 경로는 내부 article id를 다시 찾아 조회한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery('article-uuid-1');
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleSlugQuery).mockReturnValueOnce(articleTagsV2Query),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'article-uuid-1',
            locale: 'ko',
            title: 'Slug Article',
            description: 'summary',
            content: 'body',
            id: 'article-uuid-1',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: null,
            view_count: 3,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result?.id).toBe('article-uuid-1');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['ko', 'en', 'ja', 'fr'],
      target_article_id: 'article-uuid-1',
    });
  });

  it('en 요청도 공통 locale fallback 체인을 RPC에 전달한다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            locale: 'ko',
            title: '한국어 글',
            description: '설명',
            content: '본문',
            id: 'frontend-performance',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: null,
            view_count: 3,
          },
        ],
        error: null,
      }),
    };
    const articleTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(articleSlugQuery)
      .mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'en');

    expect(result?.title).toBe('한국어 글');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['en', 'ko', 'ja', 'fr'],
      target_article_id: 'frontend-performance',
    });
  });

  it('태그 relation schema가 없으면 명시적 에러를 던진다', async () => {
    const articleSlugQuery = createArticleSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            article_id: 'frontend-performance',
            locale: 'ko',
            title: 'Frontend Performance',
            description: 'rendering memo',
            content: '...',
            id: 'frontend-performance',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: '2026-03-03T09:07:50.797695+00:00',
            view_count: 12,
          },
        ],
        error: null,
      }),
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
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(articleSlugQuery)
      .mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] 태그 relation schema가 없습니다.',
    );
  });
});
