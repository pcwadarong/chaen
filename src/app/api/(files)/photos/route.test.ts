/* @vitest-environment node */

import { DELETE, POST } from '@/app/api/(files)/photos/route';
import { deletePhotoFile } from '@/entities/hero-photo/api/delete-photo-file';
import { uploadPhotoFile } from '@/entities/hero-photo/api/upload-photo-file';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/hero-photo/api/upload-photo-file', () => ({
  uploadPhotoFile: vi.fn(),
}));

vi.mock('@/entities/hero-photo/api/delete-photo-file', () => ({
  deletePhotoFile: vi.fn(),
}));

describe('api/photos route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 사진 업로드 요청에 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('file', new File(['x'], 'photo.png', { type: 'image/png' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(403);
    expect(uploadPhotoFile).not.toHaveBeenCalled();
  });

  it('허용하지 않은 포맷은 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const formData = new FormData();
    formData.set('file', new File(['x'], 'photo.webp', { type: 'image/webp' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(400);
  });

  it('사진 업로드 성공 시 업로드 결과를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadPhotoFile).mockResolvedValue({
      createdAt: '2026-03-27T09:00:00.000Z',
      fileName: 'uploaded-photo.jpg',
      filePath: 'uploaded-photo.jpg',
      mimeType: 'image/jpeg',
      publicUrl: 'https://example.com/uploaded-photo.jpg',
      size: 120_000,
    });

    const formData = new FormData();
    formData.set('file', new File(['x'], 'photo.jpg', { type: 'image/jpeg' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      item: {
        createdAt: '2026-03-27T09:00:00.000Z',
        fileName: 'uploaded-photo.jpg',
        filePath: 'uploaded-photo.jpg',
        mimeType: 'image/jpeg',
        publicUrl: 'https://example.com/uploaded-photo.jpg',
        size: 120_000,
      },
    });
    expect(uploadPhotoFile).toHaveBeenCalledWith({
      file: expect.any(File),
    });
  });

  it('filePath 없이 삭제 요청하면 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const response = await DELETE(
      new Request('http://localhost/api/photos', {
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json',
        },
        method: 'DELETE',
      }),
    );

    expect(response.status).toBe(400);
    expect(deletePhotoFile).not.toHaveBeenCalled();
  });

  it('삭제 성공 시 삭제된 filePath를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(deletePhotoFile).mockResolvedValue({
      filePath: 'uploaded-photo.jpg',
    });

    const response = await DELETE(
      new Request('http://localhost/api/photos', {
        body: JSON.stringify({
          filePath: 'uploaded-photo.jpg',
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'DELETE',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      filePath: 'uploaded-photo.jpg',
    });
    expect(deletePhotoFile).toHaveBeenCalledWith({
      filePath: 'uploaded-photo.jpg',
    });
  });
});
