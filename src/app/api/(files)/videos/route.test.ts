// @vitest-environment node

import { POST } from '@/app/api/(files)/videos/route';
import type * as EditorServerModule from '@/entities/editor/server';
import { uploadEditorVideoFile } from '@/entities/editor/server';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/server', async () => {
  const actual = await vi.importActual('@/entities/editor/server');

  return {
    ...(actual as typeof EditorServerModule),
    uploadEditorVideoFile: vi.fn(),
  };
});

describe('api/videos route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면, video upload route는 403을 반환해야 한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('contentType', 'article');
    formData.set('file', new File(['x'], 'demo.mp4', { type: 'video/mp4' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(403);
    expect(uploadEditorVideoFile).not.toHaveBeenCalled();
  });

  it('유효하지 않은 payload가 주어지면, video upload route는 400을 반환해야 한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const formData = new FormData();
    formData.set('contentType', 'article');
    formData.set('file', new File(['x'], 'demo.pdf', { type: 'application/pdf' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(400);
  });

  it('업로드 성공 시, video upload route는 공개 URL을 반환해야 한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadEditorVideoFile).mockResolvedValue(
      'https://example.com/project/videos/demo.mp4',
    );

    const formData = new FormData();
    formData.set('contentType', 'project');
    formData.set('file', new File(['x'], 'demo.mp4', { type: 'video/mp4' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://example.com/project/videos/demo.mp4',
    });
    expect(uploadEditorVideoFile).toHaveBeenCalledWith({
      contentType: 'project',
      file: expect.any(File),
    });
  });
});
