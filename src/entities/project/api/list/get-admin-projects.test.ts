/* @vitest-environment node */

import { getAdminProjects } from '@/entities/project/api/list/get-admin-projects';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

/**
 * 관리자 프로젝트 목록 조회용 Supabase query mock을 생성합니다.
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

describe('getAdminProjects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('locale fallback 번역을 결합한 관리자 프로젝트 목록을 현재 정렬 기준으로 반환한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'project-1',
            slug: 'project-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            display_order: 1,
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
          },
          {
            id: 'project-2',
            slug: 'project-2',
            visibility: 'private',
            publish_at: null,
            display_order: null,
            thumbnail_url: null,
            created_at: '2026-03-17T09:00:00.000Z',
            updated_at: null,
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
            project_id: 'project-1',
            locale: 'ko',
            title: '프로젝트 1',
          },
          {
            project_id: 'project-2',
            locale: 'en',
            title: 'Project 2',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;

        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    const result = await getAdminProjects({ locale: 'ja' });

    expect(result).toEqual([
      {
        id: 'project-1',
        title: '프로젝트 1',
        slug: 'project-1',
        visibility: 'public',
        publish_at: '2026-03-20T09:00:00.000Z',
        display_order: 1,
        thumbnail_url: null,
        created_at: '2026-03-18T09:00:00.000Z',
        updated_at: '2026-03-21T09:00:00.000Z',
      },
      {
        id: 'project-2',
        title: 'Project 2',
        slug: 'project-2',
        visibility: 'private',
        publish_at: null,
        display_order: null,
        thumbnail_url: null,
        created_at: '2026-03-17T09:00:00.000Z',
        updated_at: null,
      },
    ]);
    expect(projectsQuery.order).toHaveBeenNthCalledWith(1, 'display_order', {
      ascending: true,
      nullsFirst: false,
    });
    expect(projectsQuery.order).toHaveBeenNthCalledWith(2, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(projectsQuery.order).toHaveBeenNthCalledWith(3, 'created_at', { ascending: false });
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ja', 'ko', 'en', 'fr']);
  });
});
