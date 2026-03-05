import { NextResponse } from 'next/server';

import { verifyGuestbookSecret } from '@/entities/guestbook';

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
    const reason = error instanceof Error ? error.message : 'unknown error';
    const status = reason === 'invalid password' ? 403 : 400;

    return NextResponse.json(
      {
        ok: false,
        reason,
      },
      { status },
    );
  }
};
