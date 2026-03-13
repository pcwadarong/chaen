import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import { publishResumeContentAction, saveResumeDraftAction } from './resume-editor-actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
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

vi.mock('@/entities/pdf-file/api/get-pdf-file-availability', () => ({
  getPdfFileAvailability: vi.fn(),
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
            download_button_label: 'Download',
            download_unavailable_label: 'Preparing',
            title: 'Resume',
          },
          fr: {
            body: '',
            description: '',
            download_button_label: 'Telecharger',
            download_unavailable_label: 'Preparation',
            title: 'CV',
          },
          ja: {
            body: '',
            description: '',
            download_button_label: 'ダウンロード',
            download_unavailable_label: '準備中',
            title: '履歴書',
          },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            download_button_label: '다운로드',
            download_unavailable_label: '준비 중',
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

  it('resume publish 시 resume_contents를 upsert하고 draft를 정리한 뒤 편집 화면으로 redirect한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getPdfFileAvailability).mockResolvedValue(true);

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

    await publishResumeContentAction({
      draftId: 'resume-draft-1',
      locale: 'ko',
      settings: {
        downloadFileName: 'ParkChaewon-Resume.pdf',
        downloadPath: '/api/pdf/resume',
        filePath: 'ParkChaewon-Resume.pdf',
        isPdfReady: true,
      },
      state: {
        contents: {
          en: {
            body: '',
            description: '',
            download_button_label: 'Download',
            download_unavailable_label: 'Preparing',
            title: 'Resume',
          },
          fr: {
            body: '',
            description: '',
            download_button_label: 'Telecharger',
            download_unavailable_label: 'Preparation',
            title: 'CV',
          },
          ja: {
            body: '',
            description: '',
            download_button_label: 'ダウンロード',
            download_unavailable_label: '準備中',
            title: '履歴書',
          },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            download_button_label: '다운로드',
            download_unavailable_label: '준비 중',
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
    expect(revalidatePath).toHaveBeenCalledWith('/ko/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/en/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/resume');
    expect(redirect).toHaveBeenCalledWith('/ko/admin/resume/edit');
  });
});
