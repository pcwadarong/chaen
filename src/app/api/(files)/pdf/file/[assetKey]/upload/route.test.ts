import { revalidatePath, revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { POST } from '@/app/api/(files)/pdf/file/[assetKey]/upload/route';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
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

const createPdfUploadFile = (contents: string, type = 'application/pdf') =>
  ({
    arrayBuffer: async () => new TextEncoder().encode(contents).buffer,
    name: 'resume-ko.pdf',
    type,
  }) as File;

describe('api/pdf/file/[assetKey]/upload route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('file', new File(['pdf'], 'resume-ko.pdf', { type: 'application/pdf' }));

    const response = await POST(
      {
        formData: async () => formData,
      } as Request,
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(response.status).toBe(403);
    expect(uploadPdfFile).not.toHaveBeenCalled();
  });

  it('자산 키 고정 경로에 upsert로 pdf를 업로드한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadPdfFile).mockResolvedValue('박채원_이력서.pdf');

    const formData = {
      get: vi.fn().mockReturnValue(createPdfUploadFile('%PDF-1.7\nresume body')),
    } as unknown as FormData;

    const response = await POST(
      {
        formData: async () => formData,
      } as Request,
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(uploadPdfFile).toHaveBeenCalledWith({
      bucket: 'pdf',
      file: expect.objectContaining({
        name: 'resume-ko.pdf',
        type: 'application/pdf',
      }),
      filePath: '박채원_이력서.pdf',
      upsert: true,
    });
    expect(await response.json()).toEqual({
      assetKey: 'resume-ko',
      downloadFileName: '박채원_이력서.pdf',
      downloadPath: '/api/pdf/file/resume-ko',
      filePath: '박채원_이력서.pdf',
      isPdfReady: true,
    });
    expect(revalidateTag).toHaveBeenCalledWith('pdf-files');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-availability:resume-ko');
    expect(revalidateTag).toHaveBeenCalledWith('pdf-file-availability:resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/en/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/resume');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/resume');
  });

  it('mime type이 pdf여도 실제 시그니처가 아니면 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const formData = {
      get: vi.fn().mockReturnValue(createPdfUploadFile('not-a-real-pdf')),
    } as unknown as FormData;

    const response = await POST(
      {
        formData: async () => formData,
      } as Request,
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(uploadPdfFile).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: PDF_FILE_API_ERROR_MESSAGE.invalidUploadPayload,
    });
  });
});
