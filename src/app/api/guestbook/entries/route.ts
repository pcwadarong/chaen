import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createGuestbookEntry } from '@/entities/guestbook';
import {
  createGuestbookRepliesCacheTag,
  GUESTBOOK_CACHE_TAG,
} from '@/entities/guestbook/model/cache-tags';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { createApiErrorResponse } from '@/shared/lib/http/create-api-error-response';

type CreateEntryPayload = {
  authorBlogUrl?: unknown;
  authorName?: unknown;
  content?: unknown;
  isAdminAuthor?: unknown;
  isSecret?: unknown;
  parentId?: unknown;
  password?: unknown;
};

/**
 * 방명록 항목(원댓글/대댓글)을 생성합니다.
 */
export const POST = async (request: Request) => {
  try {
    const authState = await getServerAuthState();
    const payload = (await request.json()) as CreateEntryPayload;
    const parentId = typeof payload.parentId === 'string' ? payload.parentId : null;

    const entry = await createGuestbookEntry({
      authorBlogUrl: typeof payload.authorBlogUrl === 'string' ? payload.authorBlogUrl : null,
      authorName: authState.isAdmin
        ? 'admin'
        : typeof payload.authorName === 'string'
          ? payload.authorName
          : '',
      content: typeof payload.content === 'string' ? payload.content : '',
      isAdminAuthor: authState.isAdmin,
      isSecret: Boolean(payload.isSecret),
      parentId,
      password: authState.isAdmin
        ? ''
        : typeof payload.password === 'string'
          ? payload.password
          : '',
    });

    revalidateTag(GUESTBOOK_CACHE_TAG);
    if (entry.parent_id) {
      revalidateTag(createGuestbookRepliesCacheTag(entry.parent_id));
    }

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
