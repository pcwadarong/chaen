// @vitest-environment node

import { POST } from '@/app/api/(files)/images/route';
import type * as EditorServerModule from '@/entities/editor/server';
import { uploadEditorImageFile } from '@/entities/editor/server';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/server', async () => {
  const actual = await vi.importActual('@/entities/editor/server');

  return {
    ...(actual as typeof EditorServerModule),
    uploadEditorImageFile: vi.fn(),
  };
});

describe('api/images route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const formData = new FormData();
    formData.set('contentType', 'article');
    formData.set('file', new File(['x'], 'thumb.png', { type: 'image/png' }));
    formData.set('imageKind', 'thumbnail');

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(403);
    expect(uploadEditorImageFile).not.toHaveBeenCalled();
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
    formData.set('file', new File(['x'], 'thumb.txt', { type: 'text/plain' }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(400);
  });

  it.each([
    {
      imageKind: null,
      label: 'imageKind가 없으면',
    },
    {
      imageKind: 'invalid',
      label: 'imageKind가 잘못되면',
    },
  ])('$label 400을 반환한다', async ({ imageKind }) => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const formData = new FormData();
    formData.set('contentType', 'article');
    formData.set('file', new File(['x'], 'thumb.png', { type: 'image/png' }));

    if (imageKind) {
      formData.set('imageKind', imageKind);
    }

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(400);
  });

  it('업로드 성공 시 public URL을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(uploadEditorImageFile).mockResolvedValue('https://example.com/thumb.png');

    const formData = new FormData();
    formData.set('contentType', 'project');
    formData.set('file', new File(['x'], 'thumb.png', { type: 'image/png' }));
    formData.set('imageKind', 'content');

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://example.com/thumb.png',
    });
    expect(uploadEditorImageFile).toHaveBeenCalledWith({
      contentType: 'project',
      file: expect.any(File),
      imageKind: 'content',
    });
  });
});
