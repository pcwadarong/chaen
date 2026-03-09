import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getProjects } from './get-projects';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getProjects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 빈 페이지를 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getProjects({ locale: 'ko' });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('첫 페이지 조회는 locale 번역을 먼저 기준으로 조회하고 cache key에 initial cursor를 포함한다', async () => {
    const projectTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda-project',
            title: 'Funda Project',
            description: 'project description',
            projects: {
              thumbnail_url: null,
              created_at: '2026-03-02T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(projectTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Funda Project');
    expect(projectTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(projectTranslationsQuery.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
      referencedTable: 'projects',
    });
    expect(projectTranslationsQuery.order).toHaveBeenNthCalledWith(2, 'project_id', {
      ascending: false,
    });
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'projects',
      'list',
      'supabase-enabled',
      'ko',
      'initial',
      '12',
    ]);
  });

  it('다음 페이지 조회는 locale 번역 목록에도 keyset 조건을 적용한다', async () => {
    const projectTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(projectTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-03-02T09:07:50.797695+00:00',
        id: 'project-9',
      }),
      'utf-8',
    ).toString('base64url');

    await getProjects({ cursor, locale: 'ko' });

    expect(projectTranslationsQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,project_id.lt.project-9)',
    );
  });

  it('최근 base row에 번역이 없어도 locale 번역이 있으면 ko fallback 없이 localized 목록을 반환한다', async () => {
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'older-fr-project',
            title: 'Projet FR',
            description: 'description fr',
            projects: {
              thumbnail_url: null,
              created_at: '2026-03-01T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(targetLocaleTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'fr' });

    expect(result.items).toEqual([
      {
        id: 'older-fr-project',
        title: 'Projet FR',
        description: 'description fr',
        thumbnail_url: null,
        created_at: '2026-03-01T09:07:50.797695+00:00',
      },
    ]);
    expect(supabaseClient.from).toHaveBeenCalledTimes(1);
    expect(targetLocaleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
  });

  it('첫 페이지에서 대상 locale 번역이 정말 없으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda-project',
            title: '한국어 프로젝트',
            description: '설명',
            projects: {
              thumbnail_url: null,
              created_at: '2026-03-02T09:07:50.797695+00:00',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(targetLocaleTranslationsQuery)
        .mockReturnValueOnce(fallbackTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'fr' });

    expect(result.items[0]?.title).toBe('한국어 프로젝트');
    expect(targetLocaleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(fallbackTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const projectTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.projects" does not exist',
        },
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(projectTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjects({ locale: 'ko' })).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });
});
