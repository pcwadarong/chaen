import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createGuestbookEntry } from '@/entities/guestbook';
import { GUESTBOOK_CACHE_TAG } from '@/entities/guestbook/model/cache-tags';

type CreateEntryPayload = {
  authorBlogUrl?: unknown;
  authorName?: unknown;
  content?: unknown;
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

    const entry = await createGuestbookEntry({
      authorBlogUrl: typeof payload.authorBlogUrl === 'string' ? payload.authorBlogUrl : null,
      authorName: typeof payload.authorName === 'string' ? payload.authorName : '',
      content: typeof payload.content === 'string' ? payload.content : '',
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
    const reason = error instanceof Error ? error.message : 'unknown error';

    return NextResponse.json(
      {
        ok: false,
        reason,
      },
      { status: 400 },
    );
  }
};
