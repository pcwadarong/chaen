import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { deleteProjectAction } from '@/features/manage-project/api/delete-project';
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

describe('deleteProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('project 연관 데이터와 홈 노출 경로까지 함께 정리한다', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      rpc,
    } as never);

    await deleteProjectAction({
      projectId: 'project-1',
      projectSlug: 'project-1-slug',
    });

    expect(rpc).toHaveBeenCalledWith('delete_project_with_dependents', {
      target_project_id: 'project-1',
    });
    expect(revalidateTag).toHaveBeenCalledWith('projects');
    expect(revalidateTag).toHaveBeenCalledWith('project:project-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/en/project/project-1-slug');
    expect(revalidatePath).toHaveBeenCalledWith('/ko');
    expect(redirect).toHaveBeenCalledWith('/ko/project');
  });
});
