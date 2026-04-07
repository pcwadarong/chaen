import { redirect } from 'next/navigation';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

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

  it('관리자 세션이면 redirect 없이 인증 결과를 반환한다', async () => {
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

    await expect(requireAdmin({ locale: 'ko' })).rejects.toThrow('redirect:/admin/login');
    expect(redirect).toHaveBeenCalledWith('/admin/login');
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
