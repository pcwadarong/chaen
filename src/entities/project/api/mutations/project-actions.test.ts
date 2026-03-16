import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import { getProjects } from '@/entities/project/api/list/get-projects';
import {
  deleteProjectAction,
  getProjectDetailArchivePageAction,
  getProjectsPageAction,
} from '@/entities/project/api/mutations/project-actions';
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

vi.mock('../list/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('../detail/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('project-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('프로젝트 목록 action은 목록 조회 결과를 반환한다', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [],
      nextCursor: 'cursor-1',
    });

    const result = await getProjectsPageAction({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });

    expect(getProjects).toHaveBeenCalledWith({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });
    expect(result).toEqual({
      data: {
        items: [],
        nextCursor: 'cursor-1',
      },
      errorMessage: null,
      ok: true,
    });
  });

  it('프로젝트 아카이브 action은 입력 검증 실패를 바로 반환한다', async () => {
    const result = await getProjectDetailArchivePageAction({
      limit: 0,
      locale: 'ko',
    });

    expect(getProjectDetailList).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: null,
      errorMessage: 'Too small: expected number to be >=1',
      ok: false,
    });
  });

  it('관리자 삭제 action은 project 연관 데이터와 홈 노출 경로까지 함께 정리한다', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      rpc,
    } as never);

    await deleteProjectAction({
      locale: 'ko',
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
