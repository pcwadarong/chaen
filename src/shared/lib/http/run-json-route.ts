import { NextResponse } from 'next/server';

import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

import { createApiErrorResponse } from './api-response';

type RunJsonRouteOptions<T> = {
  action: () => Promise<Response | T>;
  adminOnly?: boolean;
  errorMessage: string;
  unauthorizedMessage?: string;
};

/**
 * JSON route handler의 인증 경계와 공통 에러 응답을 처리합니다.
 * `action`이 `Response`를 반환하면 그대로 전달하고, 일반 데이터면 JSON 응답으로 감쌉니다.
 */
export const runJsonRoute = async <T>({
  action,
  adminOnly = false,
  errorMessage,
  unauthorizedMessage = 'Forbidden',
}: RunJsonRouteOptions<T>): Promise<Response> => {
  try {
    if (adminOnly) {
      await requireAdmin({ onUnauthorized: 'throw' });
    }

    const result = await action();

    return result instanceof Response ? result : NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return createApiErrorResponse(unauthorizedMessage, 403);
    }

    return createApiErrorResponse(errorMessage, 500);
  }
};
