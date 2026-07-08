import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';

/**
 * 테스트 전용 QueryClient를 생성합니다.
 *
 * 재시도를 비활성화해 실패 케이스를 재시도 대기 없이 즉시 검증할 수 있게 하고,
 * `gcTime`을 `Infinity`로 두어 테스트 도중 캐시 엔트리가 예기치 않게
 * 정리(gc)되지 않도록 합니다.
 *
 * @returns 테스트에서 사용할 새 QueryClient 인스턴스입니다.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
      },
    },
  });

/**
 * 주어진(또는 새로 생성한) QueryClient로 하위 트리를 감싸는 래퍼 컴포넌트를 만듭니다.
 *
 * `@testing-library/react`의 `render`/`renderHook`에 `wrapper` 옵션으로 전달해
 * React Query 훅/컴포넌트를 테스트할 때 사용합니다. 테스트 간 캐시를 공유하지
 * 않으려면 매 테스트마다 새 QueryClient(기본값)를 사용하고, 특정 시나리오에서
 * 캐시 상태를 미리 세팅하려면 `queryClient.setQueryData(...)` 후 그 인스턴스를
 * 인자로 넘기면 됩니다.
 *
 * @param queryClient 사용할 QueryClient입니다. 생략하면 `createTestQueryClient()`로 새로 생성합니다.
 * @returns children을 `QueryClientProvider`로 감싸는 래퍼 컴포넌트입니다.
 */
export const createQueryClientWrapper = (queryClient: QueryClient = createTestQueryClient()) => {
  const QueryClientTestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return QueryClientTestWrapper;
};
