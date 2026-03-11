import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { checkContentSlugDuplicate } from './check-content-slug-duplicate';

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('checkContentSlugDuplicate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('articles slug가 이미 있으면 duplicate=true와 source를 반환한다', async () => {
    const articlesQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'article-1' },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const projectsQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn((table: string) => (table === 'articles' ? articlesQuery : projectsQuery)),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkContentSlugDuplicate('existing-slug')).resolves.toEqual({
      data: {
        duplicate: true,
        source: 'articles',
      },
      schemaMissing: false,
    });
  });

  it('둘 다 비어 있으면 사용 가능한 slug로 판단한다', async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(query),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkContentSlugDuplicate('fresh-slug')).resolves.toEqual({
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: false,
    });
  });

  it('content schema가 없으면 schemaMissing으로 복구한다', async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.articles" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(query),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkContentSlugDuplicate('fresh-slug')).resolves.toEqual({
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: true,
    });
  });
});
