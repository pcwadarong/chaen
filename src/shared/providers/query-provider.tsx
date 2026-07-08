'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getQueryClient } from '@/shared/lib/query/create-query-client';

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * React Query의 QueryClient를 앱 전역에 제공하는 프로바이더입니다.
 *
 * `getQueryClient()`로 환경에 맞는 QueryClient를 가져와 사용합니다.
 * `useState(() => new QueryClient())` 패턴 대신 모듈 싱글턴/서버별 신규 생성
 * 전략을 그대로 따르므로, 리렌더마다 클라이언트가 재생성되거나 서버 요청
 * 간 캐시가 섞이는 문제가 없습니다.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
