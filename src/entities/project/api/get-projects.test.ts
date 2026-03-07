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

  it('첫 페이지 조회는 keyset cache key에 initial cursor를 포함한다', async () => {
    const projectQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(projectQuery),
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'ko' });

    expect(result.items).toHaveLength(1);
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'projects',
      'list',
      'supabase-enabled',
      'ko',
      'initial',
      '12',
    ]);
  });

  it('다음 페이지 조회는 keyset 조건과 opaque cursor를 사용한다', async () => {
    const projectQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'project-2',
            title: 'p2',
            description: null,
            thumbnail_url: null,
            created_at: '2026-03-01T09:07:50.797695+00:00',
          },
        ],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(projectQuery),
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

    expect(projectQuery.or).toHaveBeenCalledWith(
      'created_at.lt.2026-03-02T09:07:50.797695+00:00,and(created_at.eq.2026-03-02T09:07:50.797695+00:00,id.lt.project-9)',
    );
    expect(vi.mocked(unstable_cache).mock.calls.at(-1)?.[1]).toEqual([
      'projects',
      'list',
      'supabase-enabled',
      'ko',
      '2026-03-02T09:07:50.797695+00:00:project-9',
      '12',
    ]);
  });

  it('첫 페이지에서 대상 locale 결과가 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const koreanFallbackQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(targetLocaleQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(koreanFallbackQuery),
        }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects({ locale: 'fr' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('funda-project');
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
    expect(targetLocaleQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanFallbackQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });
});
