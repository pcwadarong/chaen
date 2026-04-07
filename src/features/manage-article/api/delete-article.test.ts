import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { deleteArticleAction } from '@/features/manage-article/api/delete-article';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('deleteArticleAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('공개 경로와 캐시 태그를 함께 정리하고 목록으로 이동한다', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      rpc,
    } as never);

    await deleteArticleAction({
      articleId: 'article-1',
      articleSlug: 'article-1-slug',
    });

    expect(rpc).toHaveBeenCalledWith('delete_article_cascade', {
      target_article_id: 'article-1',
    });
    expect(revalidateTag).toHaveBeenCalledWith('articles');
    expect(revalidateTag).toHaveBeenCalledWith('article:article-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles/article-1-slug');
    expect(redirect).toHaveBeenCalledWith('/ko/articles');
  });
});
