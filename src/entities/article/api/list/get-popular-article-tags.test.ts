// @vitest-environment node

import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import {
  getLocalizedPopularArticleTags,
  getPopularArticleTags,
} from '@/entities/article/api/list/get-popular-article-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('next/cache', () => ({
  unstable_cacheLife: vi.fn(),
  unstable_cacheTag: vi.fn(),
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
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('relation table을 기준으로 인기 태그를 집계한다', async () => {
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
    expect(supabaseClient.from).toHaveBeenCalledWith('article_tags');
    expect(tagsQuery.in).toHaveBeenCalledWith('id', ['tag-1', 'tag-2']);
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
    expect(unstable_cacheTag).toHaveBeenCalledWith('articles');
  });

  it('집계할 태그가 없으면 slug 조회 없이 빈 배열을 반환한다', async () => {
    const articleTagsV2Query = {
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleTagsV2Query),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getPopularArticleTags({ locale: 'ko' })).resolves.toEqual([]);
    expect(supabaseClient.from).toHaveBeenCalledTimes(1);
  });

  it('relation table이 없으면 명시적 에러를 던진다', async () => {
    const articleTagsV2Query = {
      select: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.article_tags" does not exist',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(articleTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getPopularArticleTags({ locale: 'ko' })).rejects.toThrow(
      '[articles] 인기 태그 relation schema가 없습니다.',
    );
  });
});

describe('getLocalizedPopularArticleTags', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    await expect(getLocalizedPopularArticleTags({ locale: 'ko' })).resolves.toEqual([]);
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('인기 태그 집계에 locale label을 결합해 반환한다', async () => {
    const articleTagsQuery = {
      select: vi.fn().mockResolvedValue({
        data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
        error: null,
      }),
    };
    const tagsSlugMapQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-1', slug: 'nextjs' },
          { id: 'tag-2', slug: 'react' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagsBySlugQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-1', slug: 'nextjs' },
          { id: 'tag-2', slug: 'react' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { label: 'Next.js', tag_id: 'tag-1' },
          { label: 'React', tag_id: 'tag-2' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagsQueue = [tagsSlugMapQuery, tagsBySlugQuery];
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'article_tags') return articleTagsQuery;
        if (table === 'tags') return tagsQueue.shift();
        if (table === 'tag_translations') return tagTranslationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getLocalizedPopularArticleTags({ locale: 'ko' })).resolves.toEqual([
      {
        article_count: 2,
        label: 'Next.js',
        tag: 'nextjs',
      },
      {
        article_count: 1,
        label: 'React',
        tag: 'react',
      },
    ]);
    expect(vi.mocked(unstable_cacheTag).mock.calls.flat()).toContain('articles');
    expect(vi.mocked(unstable_cacheTag).mock.calls.flat()).toContain('tags');
  });

  it('인기 태그가 없으면 label 조회 없이 빈 배열을 반환한다', async () => {
    const articleTagsQuery = {
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'article_tags') return articleTagsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
      rpc: vi.fn(),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getLocalizedPopularArticleTags({ locale: 'ko' })).resolves.toEqual([]);
  });
});
