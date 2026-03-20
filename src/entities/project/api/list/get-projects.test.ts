import { unstable_cacheTag } from 'next/cache';

import { getProjects } from '@/entities/project/api/list/get-projects';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

/**
 * Supabase query builder mock을 생성합니다.
 */
const createQueryMock = ({
  result,
  terminalCall = 1,
  terminalMethod,
}: {
  result: QueryResult;
  terminalCall?: number;
  terminalMethod: 'in' | 'limit';
}) => {
  const query = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn(() =>
      terminalMethod === 'in' && query.in.mock.calls.length >= terminalCall
        ? Promise.resolve(result)
        : query,
    ),
    lte: vi.fn().mockReturnThis(),
    limit: vi
      .fn()
      .mockResolvedValue(terminalMethod === 'limit' ? result : { data: null, error: null }),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  };

  return query;
};

describe('getProjects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 빈 페이지를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getProjects({ locale: 'ko' });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('첫 페이지는 공개 base row를 먼저 읽고 각 row에 locale fallback 번역을 붙인다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            created_at: '2026-03-02T09:07:50.797695+00:00',
            id: 'project-ja',
            period_end: null,
            period_start: null,
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'project-ja',
          },
          {
            created_at: '2026-03-01T09:07:50.797695+00:00',
            id: 'project-ko-only',
            period_end: null,
            period_start: null,
            thumbnail_url: null,
            publish_at: '2026-03-01T09:07:50.797695+00:00',
            slug: 'project-ko-only',
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
            project_id: 'project-ja',
            locale: 'ja',
            title: 'Japanese Project',
            description: 'ja summary',
          },
          {
            project_id: 'project-ko-only',
            locale: 'ko',
            title: '한국어 프로젝트',
            description: 'ko summary',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const projectTechStacksQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        if (table === 'project_tech_stacks') return projectTechStacksQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'ja' });

    expect(result.items).toEqual([
      {
        id: 'project-ja',
        period_end: null,
        period_start: null,
        title: 'Japanese Project',
        description: 'ja summary',
        thumbnail_url: null,
        publish_at: '2026-03-02T09:07:50.797695+00:00',
        slug: 'project-ja',
        tech_stacks: [],
      },
      {
        id: 'project-ko-only',
        period_end: null,
        period_start: null,
        title: '한국어 프로젝트',
        description: 'ko summary',
        thumbnail_url: null,
        publish_at: '2026-03-01T09:07:50.797695+00:00',
        slug: 'project-ko-only',
        tech_stacks: [],
      },
    ]);
    expect(projectsQuery.lte).toHaveBeenCalledWith('publish_at', '2026-03-11T12:00:00.000Z');
    expect(projectsQuery.order).toHaveBeenNthCalledWith(1, 'display_order', {
      ascending: true,
      nullsFirst: false,
    });
    expect(projectsQuery.order).toHaveBeenNthCalledWith(2, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(projectsQuery.order).toHaveBeenNthCalledWith(3, 'id', { ascending: false });
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ja', 'ko', 'en', 'fr']);
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects');
  });

  it('다음 페이지 조회도 동일한 공개 필터를 유지한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const projectTechStacksQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_tech_stacks') return projectTechStacksQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await getProjects({ cursor: '1', locale: 'ko' });

    expect(projectsQuery.lte).toHaveBeenCalledWith('publish_at', '2026-03-11T12:00:00.000Z');
  });

  it('fallback 후보 전체에 번역이 없으면 명시적 에러를 던진다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            created_at: '2026-03-02T09:07:50.797695+00:00',
            id: 'project-ja',
            period_end: null,
            period_start: null,
            thumbnail_url: null,
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'project-ja',
          },
        ],
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const projectTechStacksQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        if (table === 'project_tech_stacks') return projectTechStacksQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjects({ locale: 'ja' })).rejects.toThrow(
      '[projects] 조회 가능한 번역이 없습니다. projectId=project-ja locales=ja>ko>en>fr',
    );
  });

  it('base row가 limit + 1개면 번역 결합 뒤에도 다음 cursor를 유지한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: Array.from({ length: 11 }, (_, index) => ({
          id: `project-${11 - index}`,
          created_at: `2026-03-${String(11 - index).padStart(2, '0')}T09:07:50.797695+00:00`,
          period_end: null,
          period_start: null,
          thumbnail_url: null,
          publish_at: `2026-03-${String(11 - index).padStart(2, '0')}T09:07:50.797695+00:00`,
          slug: `project-${11 - index}`,
        })),
        error: null,
      },
      terminalMethod: 'limit',
    });
    const translationsQuery = createQueryMock({
      result: {
        data: Array.from({ length: 11 }, (_, index) => ({
          project_id: `project-${11 - index}`,
          locale: 'ko',
          title: `한국어 프로젝트 ${11 - index}`,
          description: `요약 ${11 - index}`,
        })),
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const projectTechStacksQuery = createQueryMock({
      result: {
        data: [],
        error: null,
      },
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        if (table === 'project_tech_stacks') return projectTechStacksQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ limit: 10, locale: 'ko' });

    expect(result.items).toHaveLength(10);
    expect(result.nextCursor).toBe('10');
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'relation "public.projects" does not exist',
        },
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjects({ locale: 'ko' })).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('권한 오류는 base row 조회 실패로 전파한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: null,
        error: {
          message: 'permission denied for table projects',
        },
      },
      terminalMethod: 'limit',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjects({ locale: 'ko' })).rejects.toThrow(
      '[projects] 공개 프로젝트 base row 조회 실패: permission denied for table projects',
    );
  });
});
