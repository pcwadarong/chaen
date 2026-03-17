'use client';

import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AuthState } from '@/shared/lib/auth/get-server-auth-state';
import { isAdminSupabaseUser } from '@/shared/lib/auth/is-admin-supabase-user';
import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';

type AuthContextValue = AuthState;

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_AUTH_STATE: AuthContextValue = {
  isAdmin: false,
  isAuthenticated: false,
  userEmail: null,
  userId: null,
};

type AuthProviderProps = {
  adminUserId?: string | null;
  children: ReactNode;
};

/**
 * 브라우저 세션을 구독해 전역 인증 상태를 제공하는 프로바이더입니다.
 */
export const AuthProvider = ({ adminUserId = null, children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthContextValue>(EMPTY_AUTH_STATE);
  const adminIdentity = useMemo(
    () => ({
      adminUserId,
    }),
    [adminUserId],
  );

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setAuthState(EMPTY_AUTH_STATE);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let isMounted = true;

    const syncAuthState = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('[auth] syncAuthState failed', {
          adminIdentity,
          error,
        });
      }

      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthState(EMPTY_AUTH_STATE);
        return;
      }

      setAuthState({
        isAdmin: isAdminSupabaseUser(user, adminIdentity),
        isAuthenticated: Boolean(user),
        userEmail: user?.email ?? null,
        userId: user?.id ?? null,
      });
    };

    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      setAuthState({
        isAdmin: isAdminSupabaseUser(user, adminIdentity),
        isAuthenticated: Boolean(user),
        userEmail: user?.email ?? null,
        userId: user?.id ?? null,
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [adminIdentity]);

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};

/**
 * 전역 인증 상태를 읽는 훅입니다.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
