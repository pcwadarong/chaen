import { unstable_cache } from 'next/cache';
import { vi } from 'vitest';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getPopularArticleTags } from './get-popular-article-tags';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getPopularArticleTags', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    await expect(getPopularArticleTags({ locale: 'ko' })).resolves.toEqual([]);
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('locale과 limit를 RPC로 전달한다', async () => {
    const articleTagsQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const tagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-1', slug: 'nextjs' },
          { id: 'tag-2', slug: 'react' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleTagsQuery).mockReturnValueOnce(tagsQuery),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);
    articleTagsQuery.eq.mockResolvedValue({
      data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
      error: null,
    });

    await expect(getPopularArticleTags({ limit: 8, locale: 'ko' })).resolves.toEqual([
      {
        article_count: 2,
        tag: 'nextjs',
      },
      {
        article_count: 1,
        tag: 'react',
      },
    ]);
    expect(supabaseClient.from).toHaveBeenCalledWith('article_tags');
    expect(articleTagsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(tagsQuery.in).toHaveBeenCalledWith('id', ['tag-1', 'tag-2']);
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });

  it('관계형 태그 스키마가 아직 없으면 RPC fallback을 사용한다', async () => {
    const articleTagsQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleTagsQuery),
      rpc: vi.fn().mockResolvedValue({
        data: [{ article_count: 3, tag: 'nextjs' }],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);
    articleTagsQuery.eq.mockResolvedValue({
      data: null,
      error: {
        message: 'relation "public.article_tags" does not exist',
      },
    });

    await expect(getPopularArticleTags({ locale: 'ko' })).resolves.toEqual([
      { article_count: 3, tag: 'nextjs' },
    ]);
  });
});
