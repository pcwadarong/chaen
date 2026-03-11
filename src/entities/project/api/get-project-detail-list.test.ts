import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import { parseLocaleAwareCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
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
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
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
          created_at: '2026-03-02T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(translationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(translationsQuery.eq).toHaveBeenCalledWith('projects.visibility', 'public');
    expect(translationsQuery.or).toHaveBeenCalledWith(
      'publish_at.is.null,publish_at.lte.2026-03-11T12:00:00.000Z',
      {
        referencedTable: 'projects',
      },
    );
    expect(translationsQuery.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
      referencedTable: 'projects',
    });
    expect(translationsQuery.order).toHaveBeenNthCalledWith(2, 'project_id', {
      ascending: false,
    });
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects');
  });

  it('limit보다 많은 결과가 있으면 locale을 포함한 다음 cursor를 반환한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'project-2',
            title: 'Project Two',
            description: 'detail',
            projects: {
              created_at: '2026-03-02T00:00:00.000Z',
            },
          },
          {
            project_id: 'project-1',
            title: 'Project One',
            description: 'detail',
            projects: {
              created_at: '2026-03-01T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList({ locale: 'fr', limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(parseLocaleAwareCreatedAtIdCursor(result.nextCursor)).toEqual({
      createdAt: '2026-03-02T00:00:00.000Z',
      id: 'project-2',
      locale: 'fr',
    });
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
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProjectDetailList({ locale: 'fr' });

    expect(result).toEqual({
      items: [
        {
          id: 'older-fr-project',
          title: 'Projet FR',
          description: 'detail fr',
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
  });

  it('요청 locale과 ko가 비어 있으면 다음 fallback locale 아카이브 항목을 반환한다', async () => {
    const emptyTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const emptyKoTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const fallbackTranslationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            project_id: 'english-project',
            title: 'English Project',
            description: 'detail en',
            projects: {
              created_at: '2026-03-03T00:00:00.000Z',
            },
          },
        ],
        error: null,
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(emptyTranslationsQuery)
        .mockReturnValueOnce(emptyKoTranslationsQuery)
        .mockReturnValueOnce(fallbackTranslationsQuery),
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
          created_at: '2026-03-03T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(emptyTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(emptyKoTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(fallbackTranslationsQuery.eq).toHaveBeenCalledWith('locale', 'en');
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42P01',
          message: 'relation "public.projects" does not exist',
        },
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjectDetailList({ locale: 'ko' })).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('권한 오류는 schema missing으로 오분류하지 않고 원래 조회 실패로 전파한다', async () => {
    const translationsQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for table projects',
        },
      }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(translationsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProjectDetailList({ locale: 'ko' })).rejects.toThrow(
      '[projects] 상세 목록 번역 조회 실패: permission denied for table projects',
    );
  });
});
