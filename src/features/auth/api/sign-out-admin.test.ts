import { redirect } from 'next/navigation';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import { initialSignOutAdminState, signOutAdmin } from './sign-out-admin';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('signOutAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
  });

  it('로그아웃 성공 시 지정 경로로 redirect한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: null,
        }),
      },
    } as never);

    const formData = new FormData();
    formData.set('redirectPath', '/admin/login');

    await expect(signOutAdmin(initialSignOutAdminState, formData)).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/admin/login');
  });

  it('로그아웃 실패 시 에러 메시지를 반환한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: {
            message: 'sign out failed',
          },
        }),
      },
    } as never);

    const formData = new FormData();
    formData.set('redirectPath', '/admin/login');

    await expect(signOutAdmin(initialSignOutAdminState, formData)).resolves.toEqual({
      data: null,
      errorMessage: '로그아웃에 실패했습니다.',
      ok: false,
    });
  });
});
