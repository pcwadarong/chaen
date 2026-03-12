import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getAllTags, getTagIdBySlug } from './query-tags';

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
});
