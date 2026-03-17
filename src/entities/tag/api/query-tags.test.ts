import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import { getAllTags, getTagIdBySlug } from '@/entities/tag/api/query-tags';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('query-tags', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('실제 relation missing 에러는 schemaMissing으로 복구한다', async () => {
    const tagsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(tagsQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getTagIdBySlug('react')).resolves.toEqual({
      data: null,
      schemaMissing: true,
    });
  });

  it('권한 에러는 schemaMissing으로 오판하지 않고 그대로 surface한다', async () => {
    const tagsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'permission denied for table tags',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(tagsQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getTagIdBySlug('react')).rejects.toThrow(
      '[tags] slug 조회 실패: permission denied for table tags',
    );
  });

  it('전체 태그 목록을 slug 오름차순으로 조회한다', async () => {
    const tagsQuery = {
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-2', slug: 'react' },
          { id: 'tag-1', slug: 'accessibility' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(tagsQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getAllTags()).resolves.toEqual({
      data: [
        { id: 'tag-2', slug: 'react' },
        { id: 'tag-1', slug: 'accessibility' },
      ],
      schemaMissing: false,
    });
    expect(tagsQuery.order).toHaveBeenCalledWith('slug', { ascending: true });
  });

  it('getAllTags는 tags schema가 없으면 schemaMissing=true로 복구한다', async () => {
    const tagsQuery = {
      order: vi.fn().mockResolvedValue({
        data: [],
        error: {
          message: 'relation "public.tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(tagsQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getAllTags()).resolves.toEqual({
      data: [],
      schemaMissing: true,
    });
  });

  it('slug 목록을 locale별 label 맵으로 조회할 때 tags cacheTag를 사용한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            label: '리액트',
            tag_id: 'tag-1',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'tag-1',
            slug: 'react',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(tagsQuery).mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const { getTagLabelMapBySlugs } = await import('@/entities/tag/api/query-tags');
    const result = await getTagLabelMapBySlugs({
      locale: 'ko',
      slugs: ['react'],
    });

    expect(result).toEqual({
      data: new Map([['react', '리액트']]),
      schemaMissing: false,
    });
    expect(unstable_cacheTag).toHaveBeenCalledWith('tags');
  });
});
