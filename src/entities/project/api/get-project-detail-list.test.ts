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

  it('최신순 프로젝트 요약 목록을 반환한다', async () => {
    const projectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'funda',
            title: 'FUNDA',
            description: 'detail',
            created_at: '2026-03-02T00:00:00.000Z',
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

    const result = await getProjectDetailList('ko');

    expect(result).toEqual([
      {
        id: 'funda',
        title: 'FUNDA',
        description: 'detail',
        created_at: '2026-03-02T00:00:00.000Z',
      },
    ]);
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('locale 컬럼이 없으면 legacy 조회로 fallback한다', async () => {
    const localizedQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'column projects.locale does not exist',
        },
      }),
    };
    const legacyQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
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
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(localizedQuery).mockReturnValueOnce(legacyQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList('ko');

    expect(result[0]?.id).toBe('legacy-project');
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
  });
});
