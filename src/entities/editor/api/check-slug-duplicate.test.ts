import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('checkSlugDuplicate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('articles slug가 이미 있으면 duplicate=true와 source를 반환한다', async () => {
    const articlesQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: 'article-1' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const projectsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn((table: string) => (table === 'articles' ? articlesQuery : projectsQuery)),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkSlugDuplicate('existing-slug')).resolves.toEqual({
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
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(query),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkSlugDuplicate('fresh-slug')).resolves.toEqual({
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
      limit: vi.fn().mockResolvedValue({
        data: [],
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

    await expect(checkSlugDuplicate('fresh-slug')).resolves.toEqual({
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: true,
    });
  });

  it('같은 slug가 여러 행에 걸쳐 있어도 duplicate로 처리한다', async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: 'article-1' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(query),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(checkSlugDuplicate('duplicated-slug')).resolves.toEqual({
      data: {
        duplicate: true,
        source: 'articles',
      },
      schemaMissing: false,
    });
    expect(query.limit).toHaveBeenCalledWith(1);
  });
});
