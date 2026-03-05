import { NextResponse } from 'next/server';

import { getErrorMessage } from '@/shared/lib/error/get-error-message';

type CreateApiErrorResponseParams = {
  defaultStatus: number;
  error: unknown;
  fallbackMessage?: string;
  statusByReason?: Record<string, number>;
};

/**
 * API 라우트의 실패 응답 포맷({ ok: false, reason })을 통일합니다.
 *
 * - 에러 메시지를 문자열로 정규화합니다.
 * - reason별 상태코드 매핑이 있으면 우선 적용합니다.
 */
export const createApiErrorResponse = ({
  defaultStatus,
  error,
  fallbackMessage,
  statusByReason,
}: CreateApiErrorResponseParams): NextResponse => {
  const reason = getErrorMessage(error, fallbackMessage);
  const status = statusByReason?.[reason] ?? defaultStatus;

  return NextResponse.json(
    {
      ok: false,
      reason,
    },
    { status },
  );
};
