import { unstable_cache } from 'next/cache';
import { vi } from 'vitest';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getProjectDetailList } from './get-project-detail-list';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getProjectDetailList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shadow schema 기준으로 최신순 프로젝트 요약 목록을 반환한다', async () => {
    const projectBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda',
            created_at: '2026-03-02T00:00:00.000Z',
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
    };
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda',
            title: 'FUNDA',
            description: 'detail',
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
        .mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList('ko');

    expect(result).toEqual([
      {
        id: 'funda',
        title: 'FUNDA',
        description: 'detail',
        created_at: '2026-03-02T00:00:00.000Z',
      },
    ]);
    expect(projectBaseQuery.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(projectBaseQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('shadow schema가 없으면 legacy 조회로 fallback한다', async () => {
    const shadowBaseQuery = {
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.projects_v2" does not exist',
        },
      }),
      order: vi.fn().mockReturnThis(),
    };
    const legacyQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'legacy-project',
            title: 'Legacy',
            description: null,
            created_at: '2025-01-01T00:00:00.000Z',
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
          select: vi.fn().mockReturnValue(shadowBaseQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(legacyQuery),
        }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList('ko');

    expect(result[0]?.id).toBe('legacy-project');
    expect(legacyQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });
});
