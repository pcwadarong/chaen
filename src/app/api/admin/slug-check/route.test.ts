import { checkContentSlugDuplicate } from '@/entities/content/api/check-content-slug-duplicate';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { GET } from './route';

vi.mock('@/entities/content/api/check-content-slug-duplicate', () => ({
  checkContentSlugDuplicate: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('api/admin/slug-check route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    const response = await GET(new Request('https://chaen.dev/api/admin/slug-check?slug=test'));

    expect(response.status).toBe(403);
    expect(checkContentSlugDuplicate).not.toHaveBeenCalled();
  });

  it('유효하지 않은 slug는 400을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });

    const response = await GET(new Request('https://chaen.dev/api/admin/slug-check?slug=-'));

    expect(response.status).toBe(400);
    expect(checkContentSlugDuplicate).not.toHaveBeenCalled();
  });

  it('중복 확인 결과를 duplicate 응답으로 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(checkContentSlugDuplicate).mockResolvedValue({
      data: {
        duplicate: true,
        source: 'articles',
      },
      schemaMissing: false,
    });

    const response = await GET(
      new Request('https://chaen.dev/api/admin/slug-check?slug=existing-slug'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      duplicate: true,
      source: 'articles',
    });
  });

  it('content schema가 없으면 503을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(checkContentSlugDuplicate).mockResolvedValue({
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: true,
    });

    const response = await GET(new Request('https://chaen.dev/api/admin/slug-check?slug=missing'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      message: 'Slug duplicate check is temporarily unavailable',
    });
  });
});
