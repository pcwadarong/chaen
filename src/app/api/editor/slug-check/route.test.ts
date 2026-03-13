import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

import { GET } from './route';

vi.mock('@/entities/editor/api/check-slug-duplicate', () => ({
  checkSlugDuplicate: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

describe('api/editor/slug-check route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const response = await GET(
      new Request('https://chaen.dev/api/editor/slug-check?slug=test&type=article'),
    );

    expect(response.status).toBe(403);
    expect(checkSlugDuplicate).not.toHaveBeenCalled();
  });

  it('유효하지 않은 slug는 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });

    const response = await GET(
      new Request('https://chaen.dev/api/editor/slug-check?slug=-&type=article'),
    );

    expect(response.status).toBe(400);
    expect(checkSlugDuplicate).not.toHaveBeenCalled();
  });

  it('유효하지 않은 content type은 400을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });

    const response = await GET(
      new Request('https://chaen.dev/api/editor/slug-check?slug=valid-slug&type=resume'),
    );

    expect(response.status).toBe(400);
    expect(checkSlugDuplicate).not.toHaveBeenCalled();
  });

  it('중복 확인 결과를 duplicate 응답으로 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: {
        duplicate: true,
        source: 'articles',
      },
      schemaMissing: false,
    });

    const response = await GET(
      new Request(
        'https://chaen.dev/api/editor/slug-check?slug=existing-slug&type=article&excludeId=article-1',
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(checkSlugDuplicate).toHaveBeenCalledWith('existing-slug', {
      excludeId: 'article-1',
      type: 'article',
    });
    expect(body).toEqual({
      duplicate: true,
      source: 'articles',
    });
  });

  it('content schema가 없으면 503을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: true,
    });

    const response = await GET(
      new Request('https://chaen.dev/api/editor/slug-check?slug=missing&type=project'),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'Slug duplicate check is temporarily unavailable',
    });
  });
});
