/* @vitest-environment node */

import {
  getAdminArticles,
  getAdminTopArticles,
} from '@/entities/article/api/list/get-admin-articles';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

/**
 * 관리자 아티클 목록 조회용 Supabase query mock을 생성합니다.
 */
const createQueryMock = ({
  result,
  terminalMethod,
  terminalCall = 1,
}: {
  result: QueryResult;
  terminalCall?: number;
  terminalMethod: 'in' | 'limit';
}) => {
  const query = {
    in: vi.fn(() =>
      terminalMethod === 'in' && query.in.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    limit: vi
      .fn()
      .mockResolvedValue(terminalMethod === 'limit' ? result : { data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  };

  return query;
};

describe('getAdminArticles', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 아티클 목록에 locale fallback 번역과 조회수를 결합한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-1',
            slug: 'article-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
            view_count: 42,
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-1',
            locale: 'ko',
            title: '글 1',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;

        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    const result = await getAdminArticles({ locale: 'ko' });

    expect(result).toEqual([
      {
        id: 'article-1',
        title: '글 1',
        slug: 'article-1',
        visibility: 'public',
        publish_at: '2026-03-20T09:00:00.000Z',
        thumbnail_url: null,
        created_at: '2026-03-18T09:00:00.000Z',
        updated_at: '2026-03-21T09:00:00.000Z',
        view_count: 42,
      },
    ]);
    expect(articlesQuery.order).toHaveBeenNthCalledWith(1, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(articlesQuery.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false });
  });

  it('Top 5 아티클은 조회수 내림차순으로 제한 조회한다', async () => {
    const articlesQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'article-1',
            slug: 'article-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
            view_count: 42,
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [
          {
            article_id: 'article-1',
            locale: 'ko',
            title: '글 1',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesQuery;
        if (table === 'article_translations') return translationsQuery;

        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await getAdminTopArticles({ locale: 'ko' });

    expect(articlesQuery.order).toHaveBeenNthCalledWith(1, 'view_count', {
      ascending: false,
      nullsFirst: false,
    });
    expect(articlesQuery.order).toHaveBeenNthCalledWith(2, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(articlesQuery.limit).toHaveBeenCalledWith(5);
  });
});
