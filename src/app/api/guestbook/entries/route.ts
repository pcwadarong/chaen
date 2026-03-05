import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createGuestbookEntry } from '@/entities/guestbook';
import { GUESTBOOK_CACHE_TAG } from '@/entities/guestbook/model/cache-tags';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type CreateEntryPayload = {
  authorBlogUrl?: unknown;
  authorName?: unknown;
  content?: unknown;
  isAdminAuthor?: unknown;
  isAdminReply?: unknown;
  isSecret?: unknown;
  parentId?: unknown;
  password?: unknown;
};

/**
 * 방명록 항목(원댓글/대댓글)을 생성합니다.
 */
export const POST = async (request: Request) => {
  try {
    const payload = (await request.json()) as CreateEntryPayload;
    const isAdminReply = Boolean(payload.isAdminReply);

    const entry = await createGuestbookEntry({
      authorBlogUrl: typeof payload.authorBlogUrl === 'string' ? payload.authorBlogUrl : null,
      authorName: isAdminReply
        ? 'admin'
        : typeof payload.authorName === 'string'
          ? payload.authorName
          : '',
      content: typeof payload.content === 'string' ? payload.content : '',
      isAdminAuthor: Boolean(payload.isAdminAuthor),
      isAdminReply,
      isSecret: Boolean(payload.isSecret),
      parentId: typeof payload.parentId === 'string' ? payload.parentId : null,
      password: typeof payload.password === 'string' ? payload.password : '',
    });

    revalidateTag(GUESTBOOK_CACHE_TAG);

    return NextResponse.json({
      ok: true,
      entry,
    });
  } catch (error) {
    return createApiErrorResponse({
      defaultStatus: 400,
      error,
    });
  }
};
