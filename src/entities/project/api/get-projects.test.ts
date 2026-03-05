import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import { getProjects } from './get-projects';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getProjects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 빈 배열을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getProjects('ko');

    expect(result).toEqual([]);
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('Supabase env가 있으면 캐시 키에 scope를 포함해 조회한다', async () => {
    const projectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(projectQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects('ko');

    expect(result).toHaveLength(1);
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'projects',
      'list',
      'supabase-enabled',
      'ko',
    ]);
  });

  it('대상 locale 결과가 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    const koreanFallbackQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda-project',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            locale: 'ko',
          },
        ],
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(targetLocaleQuery).mockReturnValueOnce(koreanFallbackQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjects('fr');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('funda-project');
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
    expect(targetLocaleQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanFallbackQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });
});
