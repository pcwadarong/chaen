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

  it('첫 페이지 조회는 shadow schema를 우선 사용하고 cache key에 initial cursor를 포함한다', async () => {
    const projectBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const translationQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda-project',
            title: 'Funda Project',
            description: 'project description',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(projectBaseQuery),
        })
        .mockReturnValueOnce(translationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Funda Project');
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'projects',
      'list',
      'supabase-enabled',
      'ko',
      'initial',
      '12',
    ]);
  });

  it('다음 페이지 조회는 shadow base table에도 keyset 조건을 적용한다', async () => {
    const projectBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(projectBaseQuery),
      }),
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

    expect(projectBaseQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.project-9)',
    );
  });

  it('첫 페이지에서 대상 locale 번역이 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const targetLocaleTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda-project',
            title: '한국어 프로젝트',
            description: '설명',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(targetLocaleBaseQuery),
        })
        .mockReturnValueOnce(targetLocaleTranslationsQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fallbackBaseQuery),
        })
        .mockReturnValueOnce(fallbackTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'fr' });

    expect(result.items[0]?.title).toBe('한국어 프로젝트');
    expect(targetLocaleTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(fallbackTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('shadow schema가 없으면 명시적 에러를 던진다', async () => {
    const projectBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.projects" does not exist',
        },
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(projectBaseQuery),
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjects({ locale: 'ko' })).rejects.toThrow(
      '[projects] shadow content schema가 없습니다.',
    );
  });
});
