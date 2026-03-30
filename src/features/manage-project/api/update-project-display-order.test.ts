/* @vitest-environment node */

import { revalidatePath, revalidateTag } from 'next/cache';

import { updateProjectDisplayOrderAction } from '@/features/manage-project/api/update-project-display-order';
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

describe('updateProjectDisplayOrderAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('전달된 순서대로 display_order를 다시 저장하고 공개 경로를 재검증한다', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        upsert,
      })),
    } as never);

    await updateProjectDisplayOrderAction({
      locale: 'ko',
      orderedProjectIds: ['project-2', 'project-1'],
    });

    expect(upsert).toHaveBeenCalledWith(
      [
        { id: 'project-2', display_order: 1 },
        { id: 'project-1', display_order: 2 },
      ],
      { onConflict: 'id' },
    );
    expect(revalidateTag).toHaveBeenCalledWith('projects');
    expect(revalidateTag).toHaveBeenCalledWith('project:project-2');
    expect(revalidateTag).toHaveBeenCalledWith('project:project-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/content');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/ko');
  });
});
