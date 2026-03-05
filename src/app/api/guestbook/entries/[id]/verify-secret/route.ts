import { NextResponse } from 'next/server';

import { verifyGuestbookSecret } from '@/entities/guestbook';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type VerifyPayload = {
  password?: unknown;
};

/**
 * 비밀글 열람을 위한 비밀번호 검증을 수행하고 성공 시 실제 본문을 반환합니다.
 */
export const POST = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as VerifyPayload;

    const entry = await verifyGuestbookSecret({
      entryId: id,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    return NextResponse.json({
      ok: true,
      entry,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 400,
      error,
      statusByReason: {
        'invalid password': 403,
      },
    });
  }
};
