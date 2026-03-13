import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import { parseLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getProjectDetailList } from './get-project-detail-list';

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

describe('getProjectDetailList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('content schema 기준으로 최신순 프로젝트 요약 목록을 반환한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'funda',
            publish_at: '2026-03-02T00:00:00.000Z',
            slug: 'funda',
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
            project_id: 'funda',
            locale: 'ko',
            title: 'FUNDA',
            description: 'detail',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList({ locale: 'ko' });

    expect(result).toEqual({
      items: [
        {
          id: 'funda',
          title: 'FUNDA',
          description: 'detail',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'funda',
        },
      ],
      nextCursor: null,
    });
    expect(projectsQuery.or).toHaveBeenCalledWith('publish_at.lte.2026-03-11T12:00:00.000Z');
    expect(translationsQuery.in).toHaveBeenNthCalledWith(2, 'locale', ['ko', 'en', 'ja', 'fr']);
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects');
  });

  it('limit보다 많은 결과가 있으면 요청 locale을 포함한 다음 cursor를 반환한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'project-2',
            publish_at: '2026-03-02T00:00:00.000Z',
            slug: 'project-2',
          },
          {
            id: 'project-1',
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'project-1',
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
            project_id: 'project-2',
            locale: 'fr',
            title: 'Project Two',
            description: 'detail',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList({ locale: 'fr', limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(parseLocaleAwarePublishedAtIdCursor(result.nextCursor)).toEqual({
      id: 'project-2',
      locale: 'fr',
      publishedAt: '2026-03-02T00:00:00.000Z',
    });
  });

  it('요청 locale 번역이 없어도 fallback locale 아카이브 항목을 반환한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: [
          {
            id: 'english-project',
            publish_at: '2026-03-03T00:00:00.000Z',
            slug: 'english-project',
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
            project_id: 'english-project',
            locale: 'en',
            title: 'English Project',
            description: 'detail en',
          },
        ],
        error: null,
      },
      terminalCall: 2,
      terminalMethod: 'in',
    });
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsQuery;
        if (table === 'project_translations') return translationsQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList({ locale: 'fr' });

    expect(result).toEqual({
      items: [
        {
          id: 'english-project',
          title: 'English Project',
          description: 'detail en',
          publish_at: '2026-03-03T00:00:00.000Z',
          slug: 'english-project',
        },
      ],
      nextCursor: null,
    });
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: null,
        error: {
          code: '42P01',
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

    await expect(getProjectDetailList({ locale: 'ko' })).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('권한 오류는 base row 조회 실패로 전파한다', async () => {
    const projectsQuery = createQueryMock({
      result: {
        data: null,
        error: {
          code: '42501',
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

    await expect(getProjectDetailList({ locale: 'ko' })).rejects.toThrow(
      '[projects] 상세 목록 base row 조회 실패: permission denied for table projects',
    );
  });
});
