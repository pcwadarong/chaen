import { vi } from 'vitest';

import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import { getServerAuthState } from './get-server-auth-state';

vi.mock('@/shared/lib/supabase/config', () => ({
  getSupabaseAdminEnvOptional: vi.fn(() => ({
    adminUserId: 'admin-user-id',
  })),
  hasSupabaseEnv: vi.fn(() => true),
}));

vi.mock('@/shared/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('getServerAuthState', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('세션이 없으면 익명 사용자 상태를 반환한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
          error: {
            message: 'Auth session missing!',
          },
        }),
      },
    } as never);

    await expect(getServerAuthState()).resolves.toEqual({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('refresh token이 없으면 익명 사용자 상태를 반환한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
          error: {
            message: 'Invalid Refresh Token: Refresh Token Not Found',
          },
        }),
      },
    } as never);

    await expect(getServerAuthState()).resolves.toEqual({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('관리자 user id면 관리자 상태를 반환한다', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: 'admin@example.com',
              id: 'admin-user-id',
            },
          },
          error: null,
        }),
      },
    } as never);

    await expect(getServerAuthState()).resolves.toEqual({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
  });
});
