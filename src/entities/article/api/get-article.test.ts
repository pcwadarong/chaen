import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import { getArticle } from './get-article';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((callback: () => Promise<unknown>) => callback),
}));

vi.mock('@/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticle', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Supabase env가 없으면 캐시를 사용하지 않고 null을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).toBeNull();
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('Supabase env가 있으면 캐시 키에 scope를 포함해 조회한다', async () => {
    const articleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'frontend-performance',
          created_at: '2026-03-02T09:07:50.797695+00:00',
          locale: 'ko',
        },
        error: null,
      }),
    };
    const supabaseClient = {
      from: vi.fn().mockReturnValue(articleQuery),
    };

    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    const result = await getArticle('frontend-performance', 'ko');

    expect(result).not.toBeNull();
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(vi.mocked(unstable_cache).mock.calls[0]?.[1]).toEqual([
      'article',
      'supabase-enabled',
      'frontend-performance',
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
          message: 'column articles.locale does not exist',
        },
      }),
    };
    const legacyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'frontend-performance',
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

    const result = await getArticle('frontend-performance', 'ko');

    expect(result?.id).toBe('frontend-performance');
    expect(supabaseClient.from).toHaveBeenCalledTimes(2);
    expect(localizedQuery.eq).toHaveBeenCalledWith('locale', 'ko');
    expect(legacyQuery.eq).toHaveBeenCalledWith('id', 'frontend-performance');
  });
});
