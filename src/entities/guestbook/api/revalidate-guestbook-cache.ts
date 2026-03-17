import { revalidatePath, revalidateTag } from 'next/cache';

import {
  createGuestbookEntryCacheTag,
  createGuestbookRepliesCacheTag,
  GUESTBOOK_CACHE_TAG,
} from '@/entities/guestbook/model/cache-tags';
import { locales } from '@/i18n/routing';

type RevalidateGuestbookCacheOptions = {
  entryId?: string | null;
  parentId?: string | null;
};

/**
 * 방명록 관련 데이터 태그와 locale별 방명록 페이지 HTML 캐시를 함께 무효화합니다.
 */
export const revalidateGuestbookCache = ({
  entryId = null,
  parentId = null,
}: RevalidateGuestbookCacheOptions = {}) => {
  revalidateTag(GUESTBOOK_CACHE_TAG);

  if (entryId) {
    revalidateTag(createGuestbookEntryCacheTag(entryId));
    revalidateTag(createGuestbookRepliesCacheTag(entryId));
  }

  if (parentId) {
    revalidateTag(createGuestbookRepliesCacheTag(parentId));
  }

  locales.forEach(locale => {
    revalidatePath(`/${locale}/guest`);
  });
};
