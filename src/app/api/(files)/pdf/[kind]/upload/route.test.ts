import { revalidatePath, revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { POST } from '@/app/api/(files)/pdf/[kind]/upload/route';
import { uploadPdfFile } from '@/features/upload-pdf-file';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/features/upload-pdf-file', () => ({
  uploadPdfFile: vi.fn(),
}));

describe('api/pdf/[kind]/upload route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('file', new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));

    const response = await POST(
      {
        formData: async () => formData,
      } as Request,
      {
        params: Promise.resolve({
          kind: 'resume',
        }),
      },
    );

    expect(response.status).toBe(403);
    expect(uploadPdfFile).not.toHaveBeenCalled();
  });

  it('고정 경로에 upsert로 pdf를 업로드한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadPdfFile).mockResolvedValue('ParkChaewon-Resume.pdf');

    const formData = new FormData();
    formData.set('file', new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));

    const response = await POST(
      {
        formData: async () => formData,
      } as Request,
      {
        params: Promise.resolve({
          kind: 'resume',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(uploadPdfFile).toHaveBeenCalledWith({
      bucket: 'pdf',
      file: expect.any(File),
      filePath: 'ParkChaewon-Resume.pdf',
      upsert: true,
    });
    expect(await response.json()).toEqual({
      downloadFileName: 'ParkChaewon-Resume.pdf',
      downloadPath: '/api/pdf/resume',
      filePath: 'ParkChaewon-Resume.pdf',
      isPdfReady: true,
    });
    expect(revalidateTag).toHaveBeenCalledWith('pdf-files');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-availability:resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/en/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/resume');
  });
});
