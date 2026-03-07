import { vi } from 'vitest';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { getAdminPageData } from './get-admin-page-data';

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('getAdminPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 아니면 로그인 페이지 리다이렉트 경로를 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    await expect(getAdminPageData({ locale: 'ko' })).resolves.toEqual({
      redirectPath: '/ko/admin/login',
      userEmail: null,
    });
  });

  it('관리자 세션이면 현재 사용자 정보를 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });

    await expect(getAdminPageData({ locale: 'ko' })).resolves.toEqual({
      redirectPath: null,
      userEmail: 'admin@example.com',
    });
  });
});
