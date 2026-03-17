import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { AuthProvider, useAuth } from '@/shared/providers/auth-provider';

import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/supabase/client', () => ({
  createBrowserSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  hasSupabaseEnv: vi.fn(() => true),
}));

const AuthStateReader = () => {
  const authState = useAuth();

  return (
    <>
      <span data-testid="is-authenticated">{String(authState.isAuthenticated)}</span>
      <span data-testid="is-admin">{String(authState.isAdmin)}</span>
      <span data-testid="user-id">{authState.userId ?? ''}</span>
    </>
  );
};

type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;
type MockUser = {
  email?: string | null;
  id: string;
} | null;
type MockSession = {
  user: MockUser;
} | null;
type MockGetUserResult = {
  data: {
    user: MockUser;
  };
  error: Error | null;
};
type AuthStateChangeHandler = (event: string, session: MockSession) => void;

/**
 * AuthProvider 테스트용 Supabase 브라우저 클라이언트 목을 생성합니다.
 */
const createSupabaseClientMock = (
  getUserResult: MockGetUserResult = {
    data: {
      user: null,
    },
    error: null,
  },
) => {
  const unsubscribe = vi.fn();
  let handler: AuthStateChangeHandler | null = null;

  const auth = {
    getUser: vi.fn().mockResolvedValue(getUserResult),
    onAuthStateChange: vi.fn((nextHandler: AuthStateChangeHandler) => {
      handler = nextHandler;

      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };
    }),
  };

  return {
    auth,
    client: {
      auth,
    } as unknown as BrowserSupabaseClient,
    emitAuthStateChange: (event: string, session: MockSession) => handler?.(event, session),
    unsubscribe,
  };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('브라우저 세션 사용자로 인증 상태를 동기화한다', async () => {
    const { client, emitAuthStateChange } = createSupabaseClientMock({
      data: {
        user: {
          email: 'admin@example.com',
          id: 'admin-user-id',
        },
      },
      error: null,
    });
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client);

    render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('user-id')).toHaveTextContent('admin-user-id');
    });

    await act(async () => {
      emitAuthStateChange('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });
  });

  it('Supabase 환경변수가 없으면 브라우저 클라이언트를 만들지 않고 비로그인 상태를 유지한다', () => {
    vi.mocked(hasSupabaseEnv).mockReturnValue(false);

    render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    expect(createBrowserSupabaseClient).not.toHaveBeenCalled();
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
  });

  it('getUser가 실패하면 빈 인증 상태로 폴백한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = createSupabaseClientMock({
      data: {
        user: null,
      },
      error: new Error('auth failed'),
    });
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client);

    render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[auth] syncAuthState failed',
      expect.objectContaining({
        adminIdentity: { adminUserId: 'admin-user-id' },
        error: expect.any(Error),
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it('getUser가 null user를 반환하면 비로그인 상태로 유지한다', async () => {
    const { client } = createSupabaseClientMock();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client);

    render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });
  });

  it('관리자가 아닌 사용자는 인증되어도 isAdmin이 false다', async () => {
    const { client } = createSupabaseClientMock({
      data: {
        user: {
          email: 'user@example.com',
          id: 'regular-user-id',
        },
      },
      error: null,
    });
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client);

    render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('regular-user-id');
    });
  });

  it('unmount 시 auth state subscription을 정리한다', () => {
    const { client, unsubscribe } = createSupabaseClientMock();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client);

    const { unmount } = render(
      <AuthProvider adminUserId="admin-user-id">
        <AuthStateReader />
      </AuthProvider>,
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
