'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * 앱 전역에서 테마 상태를 관리하는 프로바이더입니다.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="data-theme"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
  >
    {children}
  </NextThemesProvider>
);
