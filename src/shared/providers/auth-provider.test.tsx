import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client';
import { AuthProvider, useAuth } from '@/shared/providers/auth-provider';

import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/supabase/client', () => ({
  createBrowserSupabaseClient: vi.fn(),
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

describe('AuthProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('브라우저 세션 사용자로 인증 상태를 동기화한다', async () => {
    const unsubscribe = vi.fn();

    vi.mocked(createBrowserSupabaseClient).mockReturnValue({
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
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe,
            },
          },
        }),
      },
    } as never);

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
  });
});
