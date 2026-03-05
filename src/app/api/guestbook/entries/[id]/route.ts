import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { deleteGuestbookEntry, updateGuestbookEntry } from '@/entities/guestbook';
import {
  createGuestbookEntryCacheTag,
  GUESTBOOK_CACHE_TAG,
} from '@/entities/guestbook/model/cache-tags';

type UpdatePayload = {
  content?: unknown;
  password?: unknown;
};

type DeletePayload = {
  password?: unknown;
};

/**
 * 비밀번호 검증 후 방명록 본문을 수정합니다.
 */
export const PATCH = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as UpdatePayload;

    const entry = await updateGuestbookEntry({
      content: typeof payload.content === 'string' ? payload.content : '',
      entryId: id,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(GUESTBOOK_CACHE_TAG);
    revalidateTag(createGuestbookEntryCacheTag(id));

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

/**
 * 비밀번호 검증 후 방명록을 소프트 삭제합니다.
 */
export const DELETE = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as DeletePayload;

    await deleteGuestbookEntry({
      entryId: id,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(GUESTBOOK_CACHE_TAG);
    revalidateTag(createGuestbookEntryCacheTag(id));

    return NextResponse.json({
      ok: true,
      deletedId: id,
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
