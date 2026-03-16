import { vi } from 'vitest';

import { getArticleStaticParams } from '@/entities/article/api/detail/get-article-static-params';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getArticleStaticParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
  });

  it('공개된 아티클 slug를 상세 route params 형식으로 반환한다', async () => {
    const order = vi
      .fn()
      .mockImplementationOnce(() => ({ order }))
      .mockResolvedValueOnce({
        data: [{ slug: 'article-2' }, { slug: 'article-1' }],
        error: null,
      });
    const notSlug = vi.fn(() => ({ order }));
    const notPublishAt = vi.fn(() => ({ not: notSlug }));
    const lte = vi.fn(() => ({ not: notPublishAt }));
    const eq = vi.fn(() => ({ lte }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabaseClient = { from };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleStaticParams()).resolves.toEqual([
      { id: 'article-2' },
      { id: 'article-1' },
    ]);

    expect(from).toHaveBeenCalledWith('articles');
    expect(select).toHaveBeenCalledWith('slug');
    expect(eq).toHaveBeenCalledWith('visibility', 'public');
    expect(lte).toHaveBeenCalledWith('publish_at', expect.any(String));
    expect(notPublishAt).toHaveBeenCalledWith('publish_at', 'is', null);
    expect(notSlug).toHaveBeenCalledWith('slug', 'is', null);
    expect(order).toHaveBeenNthCalledWith(1, 'publish_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
  });

  it('환경 변수가 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    await expect(getArticleStaticParams()).resolves.toEqual([]);
    expect(createOptionalPublicServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('빈 slug는 제거한다', async () => {
    const order = vi
      .fn()
      .mockImplementationOnce(() => ({ order }))
      .mockResolvedValueOnce({
        data: [{ slug: '  article-1  ' }, { slug: '   ' }, { slug: null }],
        error: null,
      });
    const notSlug = vi.fn(() => ({ order }));
    const notPublishAt = vi.fn(() => ({ not: notSlug }));
    const lte = vi.fn(() => ({ not: notPublishAt }));
    const eq = vi.fn(() => ({ lte }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabaseClient = { from };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleStaticParams()).resolves.toEqual([{ id: 'article-1' }]);
  });

  it('slug 조회 실패를 에러로 올린다', async () => {
    const order = vi
      .fn()
      .mockImplementationOnce(() => ({ order }))
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'boom' },
      });
    const notSlug = vi.fn(() => ({ order }));
    const notPublishAt = vi.fn(() => ({ not: notSlug }));
    const lte = vi.fn(() => ({ not: notPublishAt }));
    const eq = vi.fn(() => ({ lte }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabaseClient = { from };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabaseClient as never);

    await expect(getArticleStaticParams()).rejects.toThrow(
      '[articles] 정적 params slug 조회 실패: boom',
    );
  });
});
