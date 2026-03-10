import { redirect } from 'next/navigation';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import { initialSignInAdminState, signInAdmin } from './sign-in-admin';

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

describe('signInAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('유효성 검증 실패 시 에러 메시지를 반환한다', async () => {
    const result = await signInAdmin(initialSignInAdminState, new FormData());

    expect(result).toEqual({
      data: null,
      errorMessage: '이메일 형식이 올바르지 않습니다.',
      ok: false,
    });
  });

  it('로그인 성공 시 지정한 경로로 redirect한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'token',
            },
          },
          error: null,
        }),
      },
    } as never);

    const formData = new FormData();
    formData.set('email', 'admin@example.com');
    formData.set('password', 'secret-password');
    formData.set('redirectPath', '/admin');

    await expect(signInAdmin(initialSignInAdminState, formData)).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/admin');
  });

  it('인증 실패 시 사용자용 에러 메시지를 반환한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: null,
          },
          error: {
            message: 'Invalid login credentials',
          },
        }),
      },
    } as never);

    const formData = new FormData();
    formData.set('email', 'admin@example.com');
    formData.set('password', 'wrong-password');
    formData.set('redirectPath', '/admin');

    await expect(signInAdmin(initialSignInAdminState, formData)).resolves.toEqual({
      data: null,
      errorMessage: '이메일 또는 비밀번호를 다시 확인해주세요.',
      ok: false,
    });
  });
});
