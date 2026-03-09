import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getArticle } from './get-article';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticle', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 null을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).toBeNull();
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('fallback RPC를 우선 사용하면서 캐시 키에 scope를 포함한다', async () => {
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
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'article',
      'supabase-enabled',
      'frontend-performance',
      'ko',
    ]);
  });

  it('fallback RPC가 없으면 명시적 에러를 던진다', async () => {
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
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

  it('fallback 우선순위는 단일 RPC 호출에 전달한다', async () => {
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
    supabaseClient.from = vi.fn().mockReturnValueOnce(articleTagsV2Query);

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
    supabaseClient.from = vi.fn().mockReturnValueOnce(articleTagsV2Query);

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
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'fr')).rejects.toThrow(
      '[articles] 조회 가능한 번역이 없습니다. articleId=frontend-performance locales=fr>ko>en>ja',
    );
  });

  it('en 요청은 ko까지만 fallback 조회한다', async () => {
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
    supabaseClient.from = vi.fn().mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'en');

    expect(result?.title).toBe('한국어 글');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article_translation_with_fallback', {
      fallback_locales: ['en', 'ko'],
      target_article_id: 'frontend-performance',
    });
  });

  it('태그 relation schema가 없으면 명시적 에러를 던진다', async () => {
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
    supabaseClient.from = vi.fn().mockReturnValueOnce(articleTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] 태그 relation schema가 없습니다.',
    );
  });
});
