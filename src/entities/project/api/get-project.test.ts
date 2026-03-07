import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import { getProject } from './get-project';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getProject', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 null을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getProject('funda-project', 'ko');

    expect(result).toBeNull();
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('Supabase env가 있으면 캐시 키에 scope를 포함해 조회한다', async () => {
    const projectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'funda-project',
          created_at: '2026-03-02T09:07:50.797695+00:00',
          locale: 'ko',
        },
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(projectQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'ko');

    expect(result).not.toBeNull();
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'project',
      'supabase-enabled',
      'funda-project',
      'ko',
    ]);
  });

  it('locale 컬럼이 없으면 legacy 단일 조회로 fallback한다', async () => {
    const localizedQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'column projects.locale does not exist',
        },
      }),
    };
    const legacyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'funda-project',
          created_at: '2026-03-02T09:07:50.797695+00:00',
          locale: 'en',
        },
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValueOnce(localizedQuery).mockReturnValueOnce(legacyQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'ko');

    expect(result?.id).toBe('funda-project');
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
    expect(localizedQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(legacyQuery.eq).toHaveBeenCalledWith('id', 'funda-project');
  });

  it('대상 locale 결과가 없으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const koreanFallbackQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'funda-project',
          created_at: '2026-03-02T09:07:50.797695+00:00',
        },
        error: null,
      }),
    };
    const projectTagsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    projectTagsQuery.eq.mockReturnValueOnce(projectTagsQuery).mockReturnValueOnce(
      Promise.resolve({
        data: null,
        error: {
          message: 'relation "public.project_tags" does not exist',
        },
      }),
    );
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(targetLocaleQuery)
        .mockReturnValueOnce(koreanFallbackQuery)
        .mockReturnValueOnce(projectTagsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'fr');

    expect(result?.id).toBe('funda-project');
    expect(supabaseClient.from).toHaveBeenCalledTimes(3);
    expect(targetLocaleQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(koreanFallbackQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });

  it('관계형 태그 스키마가 있으면 project_tags 기준 태그 slug를 병합한다', async () => {
    const projectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'funda-project',
          created_at: '2026-03-02T09:07:50.797695+00:00',
          locale: 'ko',
          tags: null,
        },
        error: null,
      }),
    };
    const projectTagsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
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
    projectTagsQuery.eq.mockReturnValueOnce(projectTagsQuery).mockReturnValueOnce(
      Promise.resolve({
        data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
        error: null,
      }),
    );
    const supabaseClient = {
      from: vi
        .fn()
        .mockReturnValueOnce(projectQuery)
        .mockReturnValueOnce(projectTagsQuery)
        .mockReturnValueOnce(tagsQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getProject('funda-project', 'ko');

    expect(result?.tags).toEqual(['react', 'nextjs']);
  });
});
