import { revalidatePath, revalidateTag } from 'next/cache';

import {
  publishResumeContentAction,
  saveResumeDraftAction,
} from '@/entities/resume/api/resume-editor-actions';
import { RESUME_EDITOR_ERROR_MESSAGE } from '@/entities/resume/model/resume-editor-error';
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

describe('resume-editor-actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume draft를 upsert하고 draftId와 저장 시각을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const latestDraftQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    const insertDraftQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'resume-draft-1',
          updated_at: '2026-03-13T09:00:00.000Z',
        },
        error: null,
      }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValueOnce(latestDraftQuery).mockReturnValueOnce(insertDraftQuery),
    } as never);

    const result = await saveResumeDraftAction({
      locale: 'ko',
      state: {
        contents: {
          en: {
            body: '',
            description: '',
            title: 'Resume',
          },
          fr: {
            body: '',
            description: '',
            title: 'CV',
          },
          ja: {
            body: '',
            description: '',
            title: '履歴書',
          },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            title: '이력서',
          },
        },
        dirty: true,
      },
    });

    expect(result).toEqual({
      draftId: 'resume-draft-1',
      savedAt: '2026-03-13T09:00:00.000Z',
    });
    expect(insertDraftQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.objectContaining({
          ko: expect.objectContaining({
            title: '이력서',
          }),
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/resume/edit');
  });

  it('resume publish 시 resume_contents를 upsert하고 draft를 정리한 뒤 공개 resume 화면으로 redirect한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const upsertQuery = {
      upsert: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    const deleteDraftQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    deleteDraftQuery.eq.mockResolvedValueOnce({
      error: null,
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi
        .fn()
        .mockImplementation((table: string) =>
          table === 'resume_contents' ? upsertQuery : deleteDraftQuery,
        ),
    } as never);

    const result = await publishResumeContentAction({
      draftId: 'resume-draft-1',
      locale: 'ko',
      state: {
        contents: {
          en: {
            body: '',
            description: '',
            title: 'Resume',
          },
          fr: {
            body: '',
            description: '',
            title: 'CV',
          },
          ja: {
            body: '',
            description: '',
            title: '履歴書',
          },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            title: '이력서',
          },
        },
        dirty: true,
      },
    });

    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          locale: 'ko',
          title: '이력서',
        }),
      ]),
      {
        onConflict: 'locale',
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/resume/edit');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-files');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-content');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-availability:resume');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-availability:portfolio');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-content:resume');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-content:portfolio');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/en/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/en/project');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/project');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/project');
    expect(result).toEqual({ redirectPath: '/ko/resume' });
  });

  it('service role이 없으면 resume draft 저장을 중단한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    await expect(
      saveResumeDraftAction({
        locale: 'ko',
        state: {
          contents: {
            en: {
              body: '',
              description: '',
              title: 'Resume',
            },
            fr: {
              body: '',
              description: '',
              title: 'CV',
            },
            ja: {
              body: '',
              description: '',
              title: '履歴書',
            },
            ko: {
              body: '한국어 본문',
              description: '한국어 설명',
              title: '이력서',
            },
          },
          dirty: true,
        },
      }),
    ).rejects.toThrow(RESUME_EDITOR_ERROR_MESSAGE.serviceRoleUnavailable);
  });

  it('service role이 없으면 resume publish를 중단한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    await expect(
      publishResumeContentAction({
        draftId: 'resume-draft-1',
        locale: 'ko',
        state: {
          contents: {
            en: {
              body: '',
              description: '',
              title: 'Resume',
            },
            fr: {
              body: '',
              description: '',
              title: 'CV',
            },
            ja: {
              body: '',
              description: '',
              title: '履歴書',
            },
            ko: {
              body: '한국어 본문',
              description: '한국어 설명',
              title: '이력서',
            },
          },
          dirty: true,
        },
      }),
    ).rejects.toThrow(RESUME_EDITOR_ERROR_MESSAGE.serviceRoleUnavailable);
  });
});
