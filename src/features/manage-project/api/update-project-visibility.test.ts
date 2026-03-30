/* @vitest-environment node */

import { revalidatePath, revalidateTag } from 'next/cache';

import { updateProjectVisibilityAction } from '@/features/manage-project/api/update-project-visibility';
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

describe('updateProjectVisibilityAction', () => {
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

    await updateProjectVisibilityAction({
      locale: 'ko',
      projectId: 'project-1',
      projectSlug: 'project-1-slug',
      visibility: 'public',
    });

    expect(update).toHaveBeenCalledWith({ visibility: 'public' });
    expect(eq).toHaveBeenCalledWith('id', 'project-1');
    expect(revalidateTag).toHaveBeenCalledWith('projects');
    expect(revalidateTag).toHaveBeenCalledWith('project:project-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/content');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/en/project/project-1-slug');
    expect(revalidatePath).toHaveBeenCalledWith('/ko');
  });
});
