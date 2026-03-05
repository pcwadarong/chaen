'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';

type AuthContextValue = {
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * 전역 인증 상태를 제공하는 프로바이더입니다.
 * 현재 단계에서는 관리자 여부를 고정값으로 제공합니다.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin: true,
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
