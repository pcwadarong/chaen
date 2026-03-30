/* @vitest-environment node */

import { revalidatePath, revalidateTag } from 'next/cache';

import { updateArticleVisibilityAction } from '@/features/manage-article/api/update-article-visibility';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('updateArticleVisibilityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('visibility를 갱신하고 관리자/공개 경로를 다시 검증한다', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({ update })),
    } as never);

    await updateArticleVisibilityAction({
      articleId: 'article-1',
      articleSlug: 'article-1-slug',
      locale: 'ko',
      visibility: 'private',
    });

    expect(update).toHaveBeenCalledWith({ visibility: 'private' });
    expect(eq).toHaveBeenCalledWith('id', 'article-1');
    expect(revalidateTag).toHaveBeenCalledWith('articles');
    expect(revalidateTag).toHaveBeenCalledWith('article:article-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/content');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles/article-1-slug');
    expect(revalidatePath).toHaveBeenCalledWith('/ko');
  });
});
