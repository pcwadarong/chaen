import { unstable_cacheTag } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getProject } from './get-project';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

const createProjectSlugLookupQuery = (id = 'funda-project') => ({
  eq: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({
    data: { id },
    error: null,
  }),
  select: vi.fn().mockReturnThis(),
});

describe('getProject', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 null을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getProject('funda-project', 'ko');

    expect(result).toBeNull();
    expect(unstable_cacheTag).not.toHaveBeenCalled();
  });

  it('content schema를 우선 사용하면서 캐시 키에 scope를 포함한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          project_id: 'funda-project',
          title: 'Funda Project',
          description: 'project description',
          content: 'project content',
          projects: {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            period_start: '2025-01-01',
            period_end: null,
          },
        },
        error: null,
      }),
    };
    const projectTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const tagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'tag-1', slug: 'react' },
          { id: 'tag-2', slug: 'nextjs' },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(projectSlugQuery)
        .mockReturnValueOnce(translationQuery)
        .mockReturnValueOnce(projectTagsV2Query)
        .mockReturnValueOnce(tagsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'ko');

    expect(result).toMatchObject({
      id: 'funda-project',
      title: 'Funda Project',
      tags: ['react', 'nextjs'],
    });
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects', 'project:funda-project');
  });

  it('content schema가 없으면 명시적 에러를 던진다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42P01',
          message: 'relation "public.project_translations" does not exist',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery).mockReturnValueOnce(translationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('권한 오류는 schema missing으로 오인하지 않고 조회 실패로 surface한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for table project_translations',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery).mockReturnValueOnce(translationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] 번역 조회 실패: permission denied for table project_translations',
    );
  });

  it('code가 없어도 project relation missing 메시지는 content schema missing으로 본다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.project_translations" does not exist',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery).mockReturnValueOnce(translationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('다른 relation missing 메시지는 content schema missing으로 오인하지 않는다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.tags" does not exist',
        },
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery).mockReturnValueOnce(translationQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] 번역 조회 실패: relation "public.tags" does not exist',
    );
  });

  it('대상 locale 번역이 없으면 공통 locale fallback 체인 순서로 조회한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const targetLocaleTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const koreanTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          project_id: 'funda-project',
          title: '한국어 프로젝트',
          description: '설명',
          content: '본문',
          projects: {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            period_start: null,
            period_end: null,
          },
        },
        error: null,
      }),
    };
    const projectTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(projectSlugQuery)
        .mockReturnValueOnce(targetLocaleTranslationQuery)
        .mockReturnValueOnce(koreanTranslationQuery)
        .mockReturnValueOnce(projectTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'fr');

    expect(result?.title).toBe('한국어 프로젝트');
    expect(targetLocaleTranslationQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanTranslationQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('ko도 없으면 다음 fallback locale을 이어서 조회한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const targetLocaleTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const koreanTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const englishTranslationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          project_id: 'funda-project',
          title: 'English Project',
          description: 'summary',
          content: 'body',
          projects: {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            period_start: null,
            period_end: null,
          },
        },
        error: null,
      }),
    };
    const projectTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(projectSlugQuery)
        .mockReturnValueOnce(targetLocaleTranslationQuery)
        .mockReturnValueOnce(koreanTranslationQuery)
        .mockReturnValueOnce(englishTranslationQuery)
        .mockReturnValueOnce(projectTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'fr');

    expect(result?.title).toBe('English Project');
    expect(targetLocaleTranslationQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanTranslationQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(englishTranslationQuery.eq).toHaveBeenCalledWith('locale', 'en');
  });

  it('태그 relation schema가 없으면 명시적 에러를 던진다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const translationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          project_id: 'funda-project',
          title: 'Funda Project',
          description: 'project description',
          content: 'project content',
          projects: {
            id: 'funda-project',
            thumbnail_url: null,
            created_at: '2026-03-02T09:07:50.797695+00:00',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            period_start: '2025-01-01',
            period_end: null,
          },
        },
        error: null,
      }),
    };
    const projectTagsV2Query = {
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'relation "public.project_tags" does not exist',
        },
      }),
      select: vi.fn().mockReturnThis(),
    };
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(projectSlugQuery)
        .mockReturnValueOnce(translationQuery)
        .mockReturnValueOnce(projectTagsV2Query),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] 태그 relation schema가 없습니다.',
    );
  });
});
