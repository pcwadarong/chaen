import { vi } from 'vitest';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { getLoginPageData } from '@/views/auth/model/get-login-page-data';

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('getLoginPageData', () => {
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

    await expect(getLoginPageData()).resolves.toEqual({
      redirectPath: '/admin',
    });
  });

  it('관리자 세션이 아니면 redirect 없이 로그인 페이지 데이터를 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    await expect(getLoginPageData()).resolves.toEqual({
      redirectPath: null,
    });
  });
});
