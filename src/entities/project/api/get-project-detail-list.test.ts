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
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'funda',
            title: 'FUNDA',
            description: 'detail',
            projects: {
              created_at: '2026-03-02T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
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
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(translationsQuery.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
      referencedTable: 'projects',
    });
    expect(translationsQuery.order).toHaveBeenNthCalledWith(2, 'project_id', {
      ascending: false,
    });
    expect(unstable_cache).toHaveBeenCalledTimes(1);
  });

  it('최근 base row에 번역이 없어도 locale 번역이 있는 프로젝트 아카이브 항목을 반환한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'older-fr-project',
            title: 'Projet FR',
            description: 'detail fr',
            projects: {
              created_at: '2026-03-01T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList('fr');

    expect(result).toEqual([
      {
        id: 'older-fr-project',
        title: 'Projet FR',
        description: 'detail fr',
        created_at: '2026-03-01T00:00:00.000Z',
      },
    ]);
  });

  it('shadow schema가 없으면 명시적 에러를 던진다', async () => {
    const shadowTranslationsQuery = {
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
      from: vi.fn().mockReturnValueOnce(shadowTranslationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjectDetailList('ko')).rejects.toThrow(
      '[projects] shadow content schema가 없습니다.',
    );
  });
});
