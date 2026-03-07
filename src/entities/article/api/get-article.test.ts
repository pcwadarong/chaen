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

  it('shadow schema를 우선 사용하면서 캐시 키에 scope를 포함한다', async () => {
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          article_id: 'frontend-performance',
          title: 'Frontend Performance',
          description: 'rendering memo',
          content: '...',
          articles: {
            id: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: '2026-03-03T09:07:50.797695+00:00',
            view_count: 12,
          },
        },
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
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(translationQuery)
        .mockReturnValueOnce(articleTagsV2Query)
        .mockReturnValueOnce(tagsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).toMatchObject({
      id: 'frontend-performance',
      title: 'Frontend Performance',
      tags: ['nextjs', 'performance'],
    });
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'article',
      'supabase-enabled',
      'frontend-performance',
      'ko',
    ]);
  });

  it('shadow schema가 없으면 명시적 에러를 던진다', async () => {
    const shadowTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.article_translations" does not exist',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(shadowTranslationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] shadow content schema가 없습니다.',
    );
  });

  it('대상 locale 번역이 없으면 shadow schema에서도 ko locale로 fallback 조회한다', async () => {
    const targetLocaleTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const koreanTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          article_id: 'frontend-performance',
          title: '한국어 글',
          description: '설명',
          content: '본문',
          articles: {
            id: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: null,
            view_count: 3,
          },
        },
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
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(targetLocaleTranslationQuery)
        .mockReturnValueOnce(koreanTranslationQuery)
        .mockReturnValueOnce(articleTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'fr');

    expect(result?.title).toBe('한국어 글');
    expect(targetLocaleTranslationQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanTranslationQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('shadow tag relation schema가 없으면 명시적 에러를 던진다', async () => {
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          article_id: 'frontend-performance',
          title: 'Frontend Performance',
          description: 'rendering memo',
          content: '...',
          articles: {
            id: 'frontend-performance',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            updated_at: '2026-03-03T09:07:50.797695+00:00',
            view_count: 12,
          },
        },
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
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationQuery).mockReturnValueOnce(articleTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticle('frontend-performance', 'ko')).rejects.toThrow(
      '[articles] 태그 relation schema가 없습니다.',
    );
  });
});
