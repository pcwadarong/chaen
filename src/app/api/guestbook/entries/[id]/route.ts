import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { deleteGuestbookEntry, updateGuestbookEntry } from '@/entities/guestbook';
import {
  createGuestbookEntryCacheTag,
  createGuestbookRepliesCacheTag,
  GUESTBOOK_CACHE_TAG,
} from '@/entities/guestbook/model/cache-tags';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

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
    revalidateTag(createGuestbookRepliesCacheTag(entry.parent_id ?? id));

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

/**
 * 비밀번호 검증 후 방명록을 소프트 삭제합니다.
 */
export const DELETE = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as DeletePayload;

    const deleted = await deleteGuestbookEntry({
      entryId: id,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(GUESTBOOK_CACHE_TAG);
    revalidateTag(createGuestbookEntryCacheTag(id));
    revalidateTag(createGuestbookRepliesCacheTag(deleted.parentId ?? id));

    return NextResponse.json({
      ok: true,
      deletedId: id,
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
