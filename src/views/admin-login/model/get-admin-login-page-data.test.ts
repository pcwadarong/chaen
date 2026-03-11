import { vi } from 'vitest';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { getAdminLoginPageData } from './get-admin-login-page-data';

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('getAdminLoginPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이면 관리자 루트로 리다이렉트 경로를 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });

    await expect(getAdminLoginPageData({ locale: 'ko' })).resolves.toEqual({
      redirectPath: '/ko/admin',
    });
  });

  it('관리자 세션이 아니면 로그인 페이지를 유지한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    await expect(getAdminLoginPageData({ locale: 'ko' })).resolves.toEqual({
      redirectPath: null,
    });
  });
});
