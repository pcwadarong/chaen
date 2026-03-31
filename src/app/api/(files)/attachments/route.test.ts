// @vitest-environment node

import { POST } from '@/app/api/(files)/attachments/route';
import { uploadAttachmentFile } from '@/features/upload-attachment-file/api/upload-attachment-file';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/features/upload-attachment-file/api/upload-attachment-file', () => ({
  uploadAttachmentFile: vi.fn(),
}));

describe('api/attachments route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('contentType', 'article');
    formData.set('file', new File(['x'], 'resume.pdf', { type: 'application/pdf' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(403);
    expect(uploadAttachmentFile).not.toHaveBeenCalled();
  });

  it('유효하지 않은 payload면 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const formData = new FormData();
    formData.set('contentType', 'article');

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(400);
  });

  it('업로드 성공 시 첨부 파일 metadata를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadAttachmentFile).mockResolvedValue({
      contentType: 'application/pdf',
      fileName: 'resume.pdf',
      fileSize: 2048,
      url: 'https://example.com/files/resume.pdf',
    });

    const formData = new FormData();
    formData.set('contentType', 'project');
    formData.set('file', new File(['x'], 'resume.pdf', { type: 'application/pdf' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      contentType: 'application/pdf',
      fileName: 'resume.pdf',
      fileSize: 2048,
      url: 'https://example.com/files/resume.pdf',
    });
    expect(uploadAttachmentFile).toHaveBeenCalledWith({
      contentType: 'project',
      file: expect.any(File),
    });
  });
});
