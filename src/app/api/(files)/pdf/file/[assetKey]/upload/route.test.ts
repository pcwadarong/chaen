import { revalidatePath, revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { POST } from '@/app/api/(files)/pdf/file/[assetKey]/upload/route';
import type * as PdfFileEntityModule from '@/entities/pdf-file';
import { uploadPdfFile } from '@/entities/pdf-file';
import { PDF_FILE_API_ERROR_MESSAGE } from '@/entities/pdf-file/model/pdf-file-api-error';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/pdf-file', async () => {
  const actual = await vi.importActual('@/entities/pdf-file');

  return {
    ...(actual as typeof PdfFileEntityModule),
    uploadPdfFile: vi.fn(),
  };
});

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
    vi.mocked(uploadPdfFile).mockResolvedValue('pdf/ParkChaewon-Resume-kr.pdf');

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
      bucket: 'resume',
      file: expect.objectContaining({
        name: 'resume-ko.pdf',
        type: 'application/pdf',
      }),
      filePath: 'pdf/ParkChaewon-Resume-kr.pdf',
      upsert: true,
    });
    expect(await response.json()).toEqual({
      assetKey: 'resume-ko',
      downloadFileName: 'ParkChaewon-Resume-kr.pdf',
      downloadPath: '/api/pdf/file/resume-ko',
      filePath: 'pdf/ParkChaewon-Resume-kr.pdf',
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

  it('mime type이 비어 있어도 실제 시그니처가 pdf면 업로드를 진행해야 한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadPdfFile).mockResolvedValue('pdf/ParkChaewon-Resume-kr.pdf');

    const formData = {
      get: vi.fn().mockReturnValue(createPdfUploadFile('%PDF-1.7\nresume body', '')),
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
      bucket: 'resume',
      file: expect.objectContaining({
        name: 'resume-ko.pdf',
        type: '',
      }),
      filePath: 'pdf/ParkChaewon-Resume-kr.pdf',
      upsert: true,
    });
  });
});
