'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { AuthState } from '@/shared/lib/auth/get-server-auth-state';

type AuthContextValue = AuthState;

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  value: AuthContextValue;
};

/**
 * 서버에서 계산한 인증 상태를 클라이언트 트리에 주입하는 프로바이더입니다.
 */
export const AuthProvider = ({ children, value }: AuthProviderProps) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

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
