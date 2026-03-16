import { GET } from '@/app/api/editor/articles/[id]/route';
import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  getEditorSeed: vi.fn(),
}));

describe('api/editor/articles/[id] route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const response = await GET(new Request('https://chaen.dev/api/editor/articles/article-1'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('대상이 없으면 404를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getEditorSeed).mockResolvedValue(null);

    const response = await GET(new Request('https://chaen.dev/api/editor/articles/article-1'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(response.status).toBe(404);
  });
});
