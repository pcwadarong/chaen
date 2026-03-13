import { redirect } from 'next/navigation';

import { getServerAuthState } from './get-server-auth-state';
import { AdminAuthorizationError, requireAdmin } from './require-admin';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock('./get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('requireAdmin', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이면 인증 상태를 그대로 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    await expect(requireAdmin()).resolves.toEqual({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('페이지에서는 로그인 경로로 리다이렉트한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    await expect(requireAdmin({ locale: 'ko' })).rejects.toThrow('redirect:/ko/admin/login');
    expect(redirect).toHaveBeenCalledWith('/ko/admin/login');
  });

  it('route/action에서는 403 에러를 던진다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: true,
      userEmail: 'editor@example.com',
      userId: 'user-id',
    });

    await expect(requireAdmin({ onUnauthorized: 'throw' })).rejects.toBeInstanceOf(
      AdminAuthorizationError,
    );
  });
});
