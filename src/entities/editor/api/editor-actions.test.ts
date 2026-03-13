import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import { deleteEditorDraftAction } from './editor-actions';

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

vi.mock('@/shared/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('editor-actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('article draft를 공용 drafts 테이블에서 삭제한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'content_type' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(draftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'article',
      draftId: 'draft-1',
      locale: 'ko',
    });

    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(1, 'id', 'draft-1');
    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(2, 'content_type', 'article');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
  });

  it('resume draft를 전용 resume_drafts 테이블에서 삭제한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const resumeDraftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(resumeDraftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'resume',
      draftId: 'resume-draft-1',
      locale: 'ko',
    });

    expect(resumeDraftsDeleteQuery.eq).toHaveBeenCalledWith('id', 'resume-draft-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/resume/edit');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
  });

  it('다른 cache helper에는 영향 없이 draft 관련 경로만 갱신한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'content_type' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(draftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'project',
      draftId: 'draft-2',
      locale: 'ko',
    });

    expect(revalidateTag).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
