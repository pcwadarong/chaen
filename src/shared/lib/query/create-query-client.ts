import { isServer, QueryClient } from '@tanstack/react-query';

/**
 * 기본 옵션이 적용된 새 QueryClient 인스턴스를 생성합니다.
 *
 * `staleTime`은 라우트 핸들러의 `s-maxage=60`과 기준을 맞춰 60초로 두고,
 * `gcTime`은 5분, 실패 시 재시도는 1회, 창 포커스 복귀 시 자동 refetch는
 * 비활성화합니다. 서버/브라우저 어느 쪽에서도 동일한 기본값을 쓰도록
 * `getQueryClient()`가 이 함수만 호출해 인스턴스를 만듭니다.
 *
 * @returns 기본 옵션이 설정된 새 QueryClient 인스턴스입니다.
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60_000,
      },
    },
  });

/**
 * 브라우저에서 재사용할 QueryClient 싱글턴입니다.
 * 모듈이 다시 로드되지 않는 한(예: 클라이언트 라우팅) 최초 생성된 인스턴스를 유지합니다.
 */
let browserQueryClient: QueryClient | undefined;

/**
 * 실행 환경에 맞는 QueryClient 인스턴스를 반환합니다.
 *
 * 서버에서는 요청마다 새 QueryClient를 생성해 서로 다른 요청/사용자 간에
 * 캐시가 새어나가지 않도록 하고, 브라우저에서는 모듈 스코프의 싱글턴을
 * 재사용해 리렌더·라우팅 사이에도 동일한 캐시를 유지합니다.
 *
 * @returns 현재 실행 환경(서버 또는 브라우저)에 맞는 QueryClient 인스턴스입니다.
 */
export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
};
