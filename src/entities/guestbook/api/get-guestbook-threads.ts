import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';
import { parseOffsetCursor, parseOffsetLimit } from '@/shared/lib/pagination/offset-pagination';

import 'server-only';

import { createGuestbookRepliesCacheTag, GUESTBOOK_CACHE_TAG } from '../model/cache-tags';
import type {
  GuestbookEntry,
  GuestbookEntryRow,
  GuestbookThreadItem,
  GuestbookThreadPage,
} from '../model/types';

type GetGuestbookThreadsOptions = {
  cursor?: string | null;
  includeSecret?: boolean;
  limit?: number;
};

/**
 * 원댓글 목록을 조회합니다.
 */
const fetchGuestbookParents = async (
  offset: number,
  limit: number,
): Promise<GuestbookEntryRow[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('*')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`[guestbook] 원댓글 조회 실패: ${error.message}`);
  return (data ?? []) as GuestbookEntryRow[];
};

/**
 * 전달된 원댓글 id 목록에 대한 대댓글을 조회합니다.
 */
const fetchRepliesByParentIds = async (
  parentIds: string[],
  cacheScope: string,
  includeSecret: boolean,
): Promise<Record<string, GuestbookEntryRow[]>> => {
  if (parentIds.length === 0) return {};

  const readRepliesByParentId = async (parentId: string): Promise<GuestbookEntryRow[]> => {
    const supabase = createOptionalPublicServerSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('*')
      .eq('parent_id', parentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`[guestbook] 대댓글 조회 실패: ${error.message}`);
    return (data ?? []) as GuestbookEntryRow[];
  };

  const repliesByParent = await Promise.all(
    parentIds.map(async parentId => {
      if (includeSecret) {
        return [parentId, await readRepliesByParentId(parentId)] as const;
      }

      const getCachedReplies = unstable_cache(
        () => readRepliesByParentId(parentId),
        ['guestbook', 'replies', cacheScope, parentId],
        {
          tags: [GUESTBOOK_CACHE_TAG, createGuestbookRepliesCacheTag(parentId)],
          revalidate: false,
        },
      );

      return [parentId, await getCachedReplies()] as const;
    }),
  );

  return Object.fromEntries(repliesByParent);
};

/**
 * 비밀글 노출 정책에 맞춰 공개 가능한 형태로 항목을 변환합니다.
 */
const toPublicGuestbookEntry = (
  entry: GuestbookEntryRow,
  includeSecret: boolean,
): GuestbookEntry => {
  const { password_hash: _passwordHash, ...publicEntry } = entry;
  if (!entry.is_secret || includeSecret) {
    return {
      ...publicEntry,
      is_content_masked: false,
    };
  }

  return {
    ...publicEntry,
    content: '',
    is_content_masked: true,
  };
};

/**
 * 방명록 원댓글+대댓글 페이지 데이터를 cursor(offset) 기반으로 조회합니다.
 * `nextCursor`를 다음 요청의 `cursor`로 전달하면 무한스크롤을 이어갈 수 있습니다.
 */
export const getGuestbookThreads = async ({
  cursor,
  includeSecret = false,
  limit,
}: GetGuestbookThreadsOptions): Promise<GuestbookThreadPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') {
    return {
      items: [],
      nextCursor: null,
    };
  }

  const normalizedLimit = parseOffsetLimit(limit);
  const offset = parseOffsetCursor(cursor);
  const cacheCursor = String(offset);

  const readThreads = async () => {
    const parents = await fetchGuestbookParents(offset, normalizedLimit);
    const parentIds = parents.map(parent => parent.id);
    const repliesByParentId = await fetchRepliesByParentIds(parentIds, cacheScope, includeSecret);

    const items: GuestbookThreadItem[] = parents.flatMap(parent => {
      const replies = (repliesByParentId[parent.id] ?? []).map(reply =>
        toPublicGuestbookEntry(reply, includeSecret),
      );
      const shouldHideDeletedParent = Boolean(parent.deleted_at) && replies.length === 0;
      if (shouldHideDeletedParent) return [];

      return [
        {
          ...toPublicGuestbookEntry(parent, includeSecret),
          replies,
        },
      ];
    });

    return {
      items,
      nextCursor: parents.length === normalizedLimit ? String(offset + parents.length) : null,
    };
  };

  if (includeSecret) {
    return readThreads();
  }

  const getCachedThreads = unstable_cache(
    readThreads,
    ['guestbook', 'threads', cacheScope, cacheCursor, String(normalizedLimit)],
    {
      tags: [GUESTBOOK_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedThreads();
};
