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

  it('shadow relation table이 있으면 locale 조건 없이 article_tags_v2를 집계한다', async () => {
    const articleTagsV2Query = {
      select: vi.fn().mockResolvedValue({
        data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
        error: null,
      }),
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
      from: vi.fn().mockReturnValueOnce(articleTagsV2Query).mockReturnValueOnce(tagsQuery),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

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
    expect(supabaseClient.from).toHaveBeenCalledWith('article_tags_v2');
    expect(tagsQuery.in).toHaveBeenCalledWith('id', ['tag-1', 'tag-2']);
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });

  it('shadow와 legacy relation table이 모두 없으면 에러를 던진다', async () => {
    const articleTagsV2Query = {
      select: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.article_tags_v2" does not exist',
        },
      }),
    };
    const articleTagsQuery = {
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.article_tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleTagsV2Query).mockReturnValueOnce(articleTagsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getPopularArticleTags({ locale: 'ko' })).rejects.toThrow(
      '[articles] 인기 태그 relation schema가 없습니다.',
    );
  });
});
