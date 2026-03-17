import { unstable_cacheTag } from 'next/cache';

import { getProject, getResolvedProject } from '@/entities/project/api/detail/get-project';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

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
  lte: vi.fn().mockReturnThis(),
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

  it('fallback RPC를 우선 사용하면서 캐시 키에 scope를 포함한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            allow_comments: true,
            content: 'project content',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            description: 'project description',
            id: 'funda-project',
            locale: 'ko',
            period_end: null,
            period_start: '2025-01-01',
            project_id: 'funda-project',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            thumbnail_url: null,
            title: 'Funda Project',
            visibility: 'public',
          },
        ],
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
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(projectSlugQuery)
      .mockReturnValueOnce(projectTagsV2Query)
      .mockReturnValueOnce(tagsQuery);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'ko');

    expect(result).toMatchObject({
      id: 'funda-project',
      title: 'Funda Project',
      tags: ['react', 'nextjs'],
    });
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_project_translation_with_fallback', {
      fallback_locales: ['ko', 'en', 'ja', 'fr'],
      target_project_id: 'funda-project',
    });
    expect(projectSlugQuery.lte).toHaveBeenCalledTimes(1);
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects', 'project:funda-project');
  });

  it('fallback RPC가 없으면 명시적 에러를 던진다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42883',
          message:
            'function public.get_project_translation_with_fallback(target_project_id, fallback_locales) does not exist',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('PostgREST missing function 코드는 content schema missing으로 본다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST202',
          message: 'Could not find the function public.get_project_translation_with_fallback',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] content schema가 없습니다.',
    );
  });

  it('권한 오류는 content schema missing으로 오인하지 않고 번역 조회 실패로 surface한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for function get_project_translation_with_fallback',
        },
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).rejects.toThrow(
      '[projects] 번역 조회 실패: permission denied for function get_project_translation_with_fallback',
    );
  });

  it('fallback 우선순위는 단일 RPC 호출에 전달한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            allow_comments: true,
            content: '본문',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            description: '설명',
            id: 'funda-project',
            locale: 'ko',
            period_end: null,
            period_start: null,
            project_id: 'funda-project',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            thumbnail_url: null,
            title: '한국어 프로젝트',
            visibility: 'public',
          },
        ],
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
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(projectSlugQuery)
      .mockReturnValueOnce(projectTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getResolvedProject('funda-project', 'fr');

    expect(result).toMatchObject({
      item: {
        title: '한국어 프로젝트',
      },
      resolvedLocale: 'ko',
    });
    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_project_translation_with_fallback', {
      fallback_locales: ['fr', 'ko', 'en', 'ja'],
      target_project_id: 'funda-project',
    });
  });

  it('fallback 전체에 번역이 없어도 project 단위 miss cache 태그를 남긴다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(projectSlugQuery),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'fr')).resolves.toBeNull();
    expect(unstable_cacheTag).toHaveBeenCalledWith('projects', 'project:funda-project');
  });

  it('태그 relation schema가 없으면 태그 없이 본문을 반환한다', async () => {
    const projectSlugQuery = createProjectSlugLookupQuery();
    const supabaseClient = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            allow_comments: true,
            content: 'project content',
            created_at: '2026-03-02T09:07:50.797695+00:00',
            description: 'project description',
            id: 'funda-project',
            locale: 'ko',
            period_end: null,
            period_start: '2025-01-01',
            project_id: 'funda-project',
            publish_at: '2026-03-02T09:07:50.797695+00:00',
            slug: 'funda-project',
            thumbnail_url: null,
            title: 'Funda Project',
            visibility: 'public',
          },
        ],
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
    supabaseClient.from = vi
      .fn()
      .mockReturnValueOnce(projectSlugQuery)
      .mockReturnValueOnce(projectTagsV2Query);

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getProject('funda-project', 'ko')).resolves.toMatchObject({
      id: 'funda-project',
      tags: [],
      title: 'Funda Project',
    });
  });
});
